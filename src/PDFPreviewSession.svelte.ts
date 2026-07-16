export class PDFPreviewSession implements PreviewSession {
  currentPage = $state(1);
  totalPages = $state(0);
  isLoading = $state(true);
  error = $state<string | null>(null);

  previousPage: () => void = () => {};
  nextPage: () => void = () => {};

  dispose(): void {}

  bindControls(previousPage: () => void, nextPage: () => void): () => void {
    this.previousPage = previousPage;
    this.nextPage = nextPage;
    return () => {
      this.previousPage = () => {};
      this.nextPage = () => {};
    };
  }
}
