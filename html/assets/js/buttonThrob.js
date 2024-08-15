import { throb } from './throb.js';

let element = document.documentElement;

throb(element, 255, 240, .005, '--button-color-active', false);
