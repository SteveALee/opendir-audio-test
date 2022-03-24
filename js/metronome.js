// @ts-nocheck
import * as Tone from 'tone';
//const Tone = Function('return this')().Tone; // using global script
import { readStorage, writeStorage } from './storage.js';

let player;

function stepper(min, max, step) {
  return (delta, bpm) => {
    const fnComp = delta > 1 ? Math.min : Math.max;
    const limit = delta > 1 ? max : min;
    return fnComp(limit, bpm + delta * step);
  };
}

export function metronome({
  bpm = 100,
  min = 20,
  max = 250,
  step = 5,
  pid = undefined,
} = {}) {
  const key = pid ? `metronome_${pid}` : null;
  const _bpm = readStorage(key, bpm);

  return {
    bpm: _bpm,
    checked: false,
    stepper: stepper(min, max, step),
    starting: false,

    async onClick($el, $event, $dispatch) {
      console.log('click');
      // not from unCheckOthers
      $event.preventDefault(); // we control check box state
      if (this.checked && $event.target.tagName == 'BUTTON') {
        const delta = $event.target.textContent == '<' ? -1 : 1;
        this.bpm = this.stepper(delta, this.bpm);
        writeStorage(key, this.bpm);
      } else {
        console.log(this.checked);
        this.checked = !this.checked;
        console.log(this.checked);
        if (this.checked) {
          this.starting = true;
          $dispatch('metronome-start');
        }
      }
      if (Tone.getContext().state == 'suspended') {
        await Tone.start();
      }
      this.renderAudio();
    },

    onStart() {
      console.log('start');
      if (!this.starting) {
        this.checked = false;
      }
      this.starting = false;
    },

    onStop() {
      console.log('stop');

      this.checked = false;
      this.renderAudio();
    },

    renderAudio() {
      console.log('render');
      return;
      if (!player) {
        player = new Tone.Player('/woodblock.wav').toDestination();
        Tone.loaded().then(function () {
          Tone.Transport.scheduleRepeat(function (time) {
            player.start(time);
          }, '4n');
        });
      }
      Tone.Transport.bpm.value = this.bpm;

      if (this.checked) {
        Tone.Transport.start();
      } else if (!this.checked) {
        Tone.Transport.stop();
      }
    },
  };
}
