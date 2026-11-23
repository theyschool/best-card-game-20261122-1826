// deck.js — a combat deck: draw pile, hand, discard pile and exhaust pile, all
// holding card instances ({ uid, id }) so two copies of one card stay distinct.
// Shuffling uses the run's seeded RNG (rng.js), never Math.random.

let nextUid = 1;

export function cardInstance(id) {
  return { uid: nextUid++, id };
}

export class Deck {
  constructor(rng, cardIds) {
    this.rng = rng;
    this.drawPile = rng.shuffled(cardIds.map(cardInstance));
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
  }

  /** Draw up to n cards, reshuffling the discard pile in when the draw pile runs dry. */
  draw(n) {
    const drawn = [];
    for (let i = 0; i < n; i++) {
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        this.drawPile = this.rng.shuffled(this.discardPile);
        this.discardPile = [];
      }
      const card = this.drawPile.pop();
      this.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  }

  /** Move a card out of the hand, to the discard pile or out of the combat. */
  release(card, { exhaust = false } = {}) {
    const at = this.hand.indexOf(card);
    if (at !== -1) this.hand.splice(at, 1);
    (exhaust ? this.exhaustPile : this.discardPile).push(card);
  }

  /** The end of a turn: the whole hand goes to the discard pile. */
  discardHand() {
    this.discardPile.push(...this.hand);
    this.hand = [];
  }
}
