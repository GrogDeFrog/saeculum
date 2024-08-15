import { throb } from './throb.js';

let element = document.documentElement;

throb(element, 100, 160, .005, '--link-color-active', true);
throb(element, 60, 120, .002, '--link-color-passive', true);
