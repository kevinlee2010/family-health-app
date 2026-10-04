import { useLayoutEffect, useRef, useState } from 'react'

import {
  buildPedigreeConnectorSegments,
  getBalancedParentGenerationCount,
  getPedigreeLayoutMetrics,
} from './pedigreeLayout'

function getNodeId(member) {
  return member?.id || ''
}

function getMeasuredNodes(stage) {
  const stageBounds = stage.getBoundingClientRect()
  const renderedScale = stage.offsetWidth > 0 ? stageBounds.width / stage.offsetWidth : 1
  const safeScale = renderedScale || 1

  return [...stage.querySelectorAll('[data-pedigree-node-id]')].reduce(
    (nodes, element) => {
      const bounds = element.getBoundingClientRect()
      const left = (bounds.left - stageBounds.left) / safeScale
      const top = (bounds.top - stageBounds.top) / safeScale
      const width = bounds.width / safeScale
      const height = bounds.height / safeScale

      nodes[element.dataset.pedigreeNodeId] = {
        bottom: top + height,
        centerX: left + width / 2,
        centerY: top + height / 2,
        left,
        right: left + width,
        top,
      }

      return nodes
    },
    {},
  )
}

export function PedigreeTree({
  children = [],
  father,
  maternalGrandparents = [],
  maternalRelatives = [],
  mother,
  paternalGrandparents = [],
  paternalRelatives = [],
  renderNode,
  selfMember,
  siblings = [],
}) {
  const viewportRef = useRef(null)
  const stageRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [stageHeight, setStageHeight] = useState(650)
  const [connectorSegments, setConnectorSegments] = useState([])
  const maternalGeneration = [...maternalRelatives].reverse()
  const parentGeneration = [
    ...maternalGeneration,
    mother,
    father,
    ...paternalRelatives,
  ].filter(Boolean)
  const balancedParentGenerationCount = getBalancedParentGenerationCount(
    maternalRelatives.length,
    paternalRelatives.length,
  )
  const metrics = getPedigreeLayoutMetrics([
    maternalGrandparents.length + paternalGrandparents.length,
    balancedParentGenerationCount,
    siblings.length,
    children.length,
  ])
  const maternalGrandparentIds = maternalGrandparents.map(getNodeId).join('|')
  const maternalGenerationIds = maternalGeneration.map(getNodeId).join('|')
  const paternalGrandparentIds = paternalGrandparents.map(getNodeId).join('|')
  const paternalRelativeIds = paternalRelatives.map(getNodeId).join('|')
  const siblingIds = siblings.map(getNodeId).join('|')
  const childIds = children.map(getNodeId).join('|')
  const motherId = getNodeId(mother)
  const fatherId = getNodeId(father)
  const selfId = getNodeId(selfMember)
  const memberSignature = [
    ...maternalGrandparents,
    ...paternalGrandparents,
    ...parentGeneration,
    ...siblings,
    ...children,
  ]
    .map(getNodeId)
    .join('|')

  useLayoutEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return undefined
    }

    const updateScale = () => {
      const availableWidth = viewport.clientWidth
      const fitScale = Math.min(1, availableWidth / metrics.requiredWidth)
      const nextScale =
        window.innerWidth <= 640 ? Math.max(0.72, fitScale) : fitScale

      setScale(Number(nextScale.toFixed(4)))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(viewport)
    window.addEventListener('resize', updateScale)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [metrics.requiredWidth])

  useLayoutEffect(() => {
    const stage = stageRef.current

    if (!stage) {
      return undefined
    }

    const updateGeometry = () => {
      const nodes = getMeasuredNodes(stage)
      const families = [
        {
          parentIds: maternalGrandparentIds.split('|').filter(Boolean),
          childIds: [
            ...maternalGenerationIds.split('|').filter(Boolean),
            motherId,
          ].filter(Boolean),
        },
        {
          parentIds: paternalGrandparentIds.split('|').filter(Boolean),
          childIds: [
            fatherId,
            ...paternalRelativeIds.split('|').filter(Boolean),
          ].filter(Boolean),
        },
        {
          parentIds: [motherId, fatherId].filter(Boolean),
          childIds: siblingIds.split('|').filter(Boolean),
        },
        {
          parentIds: selfId ? [selfId] : [],
          childIds: childIds.split('|').filter(Boolean),
        },
      ]

      setConnectorSegments(buildPedigreeConnectorSegments({ families, nodes }))
      setStageHeight(Math.ceil(stage.scrollHeight * scale))
    }

    updateGeometry()
    const frameId = window.requestAnimationFrame(updateGeometry)
    const observer = new ResizeObserver(updateGeometry)
    observer.observe(stage)

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [
    childIds,
    fatherId,
    maternalGenerationIds,
    maternalGrandparentIds,
    memberSignature,
    motherId,
    paternalGrandparentIds,
    paternalRelativeIds,
    scale,
    selfId,
    siblingIds,
  ])

  function renderGenerationNode(member, accent, groupId) {
    return renderNode(member, { accent, id: groupId })
  }

  return (
    <div className="pedigree-viewport" ref={viewportRef}>
      <div
        className="pedigree-stage-sizer"
        style={{
          height: `${stageHeight}px`,
          width: `${Math.ceil(metrics.requiredWidth * scale)}px`,
        }}
      >
        <div
          className="pedigree-stage"
          ref={stageRef}
          style={{
            '--pedigree-gap': `${metrics.gap}px`,
            '--pedigree-node-width': `${metrics.nodeWidth}px`,
            transform: `scale(${scale})`,
            width: `${metrics.requiredWidth}px`,
          }}
        >
          <svg
            className="pedigree-connectors"
            aria-hidden="true"
            width={metrics.requiredWidth}
            height="100%"
          >
            {connectorSegments.map((segment, index) => (
              <line
                key={`${segment.x1}-${segment.y1}-${segment.x2}-${segment.y2}-${index}`}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
              />
            ))}
          </svg>

          <div className="pedigree-generation-row pedigree-grandparent-generation">
            <div className="pedigree-side-group maternal-side-group">
              <span className="pedigree-branch-label">Mother’s Side</span>
              <div className="pedigree-node-run">
                {maternalGrandparents.map((member) =>
                  renderGenerationNode(member, 'purple', 'maternal-grandparents'),
                )}
              </div>
            </div>
            <div className="pedigree-side-group paternal-side-group">
              <span className="pedigree-branch-label">Father’s Side</span>
              <div className="pedigree-node-run">
                {paternalGrandparents.map((member) =>
                  renderGenerationNode(member, 'teal', 'paternal-grandparents'),
                )}
              </div>
            </div>
          </div>

          <div className="pedigree-generation-row pedigree-parent-generation-row">
            <div className="pedigree-node-run pedigree-parent-side-run maternal-parent-side-run">
              {maternalGeneration.map((member) =>
                renderGenerationNode(member, 'purple', 'maternal-branch'),
              )}
            </div>
            <div className="pedigree-node-run pedigree-parent-couple-run">
              {mother
                ? renderGenerationNode(mother, 'blue', 'mother-parent')
                : null}
              {father
                ? renderGenerationNode(father, 'blue', 'father-parent')
                : null}
            </div>
            <div className="pedigree-node-run pedigree-parent-side-run paternal-parent-side-run">
              {paternalRelatives.map((member) =>
                renderGenerationNode(member, 'teal', 'paternal-branch'),
              )}
            </div>
          </div>

          <div className="pedigree-generation-row pedigree-user-generation">
            <div className="pedigree-node-run">
              {siblings.map((member) =>
                renderGenerationNode(
                  member,
                  member.isSelf ? 'blue' : 'orange',
                  'siblings',
                ),
              )}
            </div>
          </div>

          {children.length > 0 ? (
            <div className="pedigree-generation-row pedigree-children-generation">
              <div className="pedigree-node-run">
                {children.map((member) =>
                  renderGenerationNode(member, 'blue', 'children'),
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
