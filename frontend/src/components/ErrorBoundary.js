import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React render error caught by ErrorBoundary:", error, errorInfo);
  }

  handleTryAgain = () => {
    this.setState({
      hasError: false
    });
  };

  handleReload = () => {
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-shell">
          <section className="listings-panel">
            <div className="status-card status-card--error error-boundary">
              <p className="hero__eyebrow">Unexpected Error</p>
              <h1 className="error-boundary__title">Something went wrong.</h1>
              <p className="error-boundary__message">
                The page hit a render error. Try again, or reload the listings page.
              </p>
              <div className="error-boundary__actions">
                <button
                  className="button button--primary"
                  type="button"
                  onClick={this.handleTryAgain}
                >
                  Try Again
                </button>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={this.handleReload}
                >
                  Reload Listings
                </button>
              </div>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
