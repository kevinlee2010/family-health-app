const steps = [
  {
    description:
      'Create a secure account to save your health profile and access it across your devices.',
    title: 'Create Your Account',
  },
  {
    description:
      'Add your family history, everyday habits, and basic health information at your own pace.',
    title: 'Build Your Health Profile',
  },
  {
    description:
      'Review health themes and focus areas shaped by your profile.',
    title: 'Understand Your Health Profile',
  },
  {
    description:
      'Track your progress, explore trusted local resources, and keep your profile up to date as your health journey evolves.',
    title: 'Continue Your Journey',
  },
]

export function PublicHome({ onGetStarted, onSignIn }) {
  return (
    <main className="public-home">
      <header className="public-home-header">
        <a className="public-brand" href="#top" aria-label="Family Health home">
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          <span>Family Health</span>
        </a>

        <nav className="public-nav" aria-label="Public navigation">
          <a href="#how-it-works">How It Works</a>
          <a href="#privacy">Privacy</a>
          <button type="button" onClick={onSignIn}>
            Sign In
          </button>
        </nav>
      </header>

      <section className="public-hero" id="top">
        <div className="public-hero-copy">
          <h1>Your Journey to Better Prevention Starts Here</h1>
          <p>
            Build your family health profile to discover meaningful patterns, receive
            personalized educational insights, and make informed health decisions over time.
          </p>
          <div className="public-hero-actions">
            <button className="primary-action" type="button" onClick={onGetStarted}>
              Get Started
            </button>
            <button className="secondary-action" type="button" onClick={onSignIn}>
              Sign In
            </button>
          </div>
        </div>

        <div className="public-hero-panel" aria-label="Family Health preview">
          <div>
            <span>Family profile</span>
            <strong>Private, account-based</strong>
          </div>
          <div>
            <span>Insights</span>
            <strong>Educational prevention topics</strong>
          </div>
          <div>
            <span>Daily actions</span>
            <strong>Small supportive steps</strong>
          </div>
        </div>
      </section>

      <section className="public-section public-how" id="how-it-works" aria-labelledby="how-title">
        <div className="public-section-heading">
          <h2 id="how-title">How It Works</h2>
        </div>
        <ol className="public-step-list">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span>{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="public-privacy" id="privacy" aria-labelledby="privacy-title">
        <div>
          <h2 id="privacy-title">Your information stays private</h2>
          <p>
            Your information is stored with your signed-in account and is not sold or
            used for advertising. This app offers educational information and is not a
            diagnosis.
          </p>
        </div>
        <p className="public-safety-disclaimer">
          Family Health does not provide medical advice, diagnosis, treatment, or
          emergency monitoring.
        </p>
      </section>

      <footer className="public-footer">
        <a href="#privacy">Privacy</a>
        <button type="button" onClick={onSignIn}>
          Sign In
        </button>
        <button type="button" onClick={onGetStarted}>
          Create Account
        </button>
        <span>Educational use only</span>
      </footer>
    </main>
  )
}
