import keyMirror from 'keymirror';
import {Bot, Context, Types} from '../chatbot.es6';
import {step, CATCH, FALLBACK, PROXY} from './fsm.es6';

const TAG = 'entree';

function wrap(a) {
  return {output: a};
}

export default class Entree extends Bot {
  static Context = class extends Context {
    state = Entree.State.START;
    started = undefined;
  };

  static botname = 'Entree';
  static version = 1;

  static Actions = keyMirror({INPUT: null, FAILED_PAYMENT: null});
  static State = keyMirror({START: null, RESTAURANTS: null});

  static actionTypes = {
    onViewRestaurant: Types.Async.any()
  };

  static adapterTypes = {
    getRestaurants: Types.Async.parse({
      id: String,
      location: Object,
      views: Number
    })
  };

  static createContext = uid => new Entree.Context(uid);

  constructor(...args) {
    super(...args);

    this.registerAction(Entree.Actions.INPUT, this.onInput);
    this.registerAction(Entree.Actions.FAILED_PAYMENT, this.onFailedPayment);
  }

  async onFailedPayment(id) {
    return {text: 'failed payment!'};
  }

  async onInput({text = '', optin = false, images, location, data = {}}, {first}) {
    const {context, actions, adapters} = this;

    const result = await step({
      [PROXY]: {
        transitions: {
          help: {
            test: /^help$/ig,
            process: async () => wrap({text: 'Help'})
          },
          checkOptin: {
            test: [context.started, !!optin],
            process: async () => ({text: 'You are already signed up!'})
          }
        }
      },
      [Entree.State.START]: {
        transitions: {
          introduction: {
            test: !context.started,
            process: async () => {
              return {text: 'Hey first time user'};
            }
          },
          tutorialStep1: {
            // ...
          },
          [FALLBACK]: {
            process: async() =>
              wrap({text: 'I dont understand'})
          }
        }
      },
      [CATCH]: {
        process: async e => ({text: e.message.substr(0, 200)})
      },
      [FALLBACK]: {
        transitions: {
          help: {
            test: /^\/help$/,
            process: async () => 'Help!'
          }
        }
      }
    }, this.context.state, text || '', this);


    return result.text; // or whatever
  }
}
