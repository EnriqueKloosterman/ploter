declare module 'epub-gen' {
  interface EpubChapter {
    title: string;
    data: string;
    beforeToc?: boolean;
  }

  interface EpubOptions {
    title: string;
    author?: string;
    publisher?: string;
    lang?: string;
    tocTitle?: string;
    appendChapterTitles?: boolean;
    date?: string;
    content: EpubChapter[];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type EpubCallback = (err?: any) => void;

  class EPub {
    constructor(options: EpubOptions, outputPath: string);
    on(event: 'error' | 'end' | 'done', callback: EpubCallback): void;
    create(): void;
  }

  export = EPub;
}