// Simple app container without external dependencies
class AppContainer {
  private initialized = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Basic initialization without external dependencies
    this.initialized = true;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const appContainer = new AppContainer();

// Initialize on import
appContainer.initialize();