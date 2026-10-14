import { playSound } from './audio';
import { TimerEngine } from './logic/timerEngine';

/** En enda timer åt gången (vilotimer eller HIIT). */
export const engine = new TimerEngine(playSound);
