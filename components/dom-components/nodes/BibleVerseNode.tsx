import { 
  DOMExportOutput,
  NodeKey,
  EditorConfig,
  SerializedLexicalNode,
  LexicalNode,
  Spread,
  DOMConversionMap,
  DOMConversionOutput,
  DecoratorNode
} from 'lexical';
import { BibleVerseComponent } from '@/components/dom-components/BibleVerseComponent';

export interface BibleVerseAttributes {
  reference: string;
  verseText: string;
  translation?: string;
}

export type SerializedBibleVerseNode = Spread<
  {
    reference: string;
    verseText: string;
    translation?: string;
    type: 'bible-verse';
    version: 1;
  },
  SerializedLexicalNode
>;

export class BibleVerseNode extends DecoratorNode<JSX.Element> {
  __reference: string;
  __verseText: string;
  __translation: string;

  static getType(): string {
    return 'bible-verse';
  }

  static clone(node: BibleVerseNode): BibleVerseNode {
    return new BibleVerseNode(
      node.__reference,
      node.__verseText,
      node.__translation,
      node.__key,
    );
  }

  constructor(
    reference: string,
    verseText: string,
    translation: string = 'NIV',
    key?: NodeKey,
  ) {
    super(key);
    this.__reference = reference;
    this.__verseText = verseText;
    this.__translation = translation;
  }

  updateAttributes(attributes: Partial<BibleVerseAttributes>): void {
    const self = this.getWritable();
    if (attributes.reference !== undefined) {
      self.__reference = attributes.reference;
    }
    if (attributes.verseText !== undefined) {
      self.__verseText = attributes.verseText;
    }
    if (attributes.translation !== undefined) {
      self.__translation = attributes.translation;
    }
  }

  static importJSON(serializedNode: SerializedBibleVerseNode): BibleVerseNode {
    const { reference, verseText, translation = 'NIV' } = serializedNode;
    const node = $createBibleVerseNode(reference, verseText, translation);
    return node;
  }

  exportJSON(): SerializedBibleVerseNode {
    return {
      type: 'bible-verse',
      version: 1,
      reference: this.__reference,
      verseText: this.__verseText,
      translation: this.__translation,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'BibleVerse';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.classList.contains('BibleVerse')) {
          return {
            conversion: convertBibleVerseElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  decorate(): JSX.Element {
    return (
      <BibleVerseComponent
        reference={this.__reference}
        verseText={this.__verseText}
        nodeKey={this.__key}
        translation={this.__translation}
      />
    );
  }
}

function convertBibleVerseElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const reference = domNode.getAttribute('data-reference');
  const verseText = domNode.getAttribute('data-verse-text') || '';
  const translation = domNode.getAttribute('data-translation') || 'NIV';
  
  if (reference) {
    const node = $createBibleVerseNode(reference, verseText, translation);
    return { node };
  }
  return null;
}

export function $createBibleVerseNode(
  reference: string,
  verseText: string,
  translation: string = 'NIV',
): BibleVerseNode {
  return new BibleVerseNode(reference, verseText, translation);
}

export function $isBibleVerseNode(
  node: LexicalNode | null | undefined,
): node is BibleVerseNode {
  return node instanceof BibleVerseNode;
} 