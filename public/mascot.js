import { mascotLines } from "./content.js";

let currentTimer;
let recent = [];
let currentFigure;
let base = "idle";

export function attachMascot(figure, initial = "idle") {
  clearTimeout(currentTimer);
  currentFigure = figure;
  base = initial;
  if (figure) figure.dataset.mood = initial;
}

export function setMascot(mood, duration = 1300) {
  if (!currentFigure?.isConnected) return;
  clearTimeout(currentTimer);
  currentFigure.dataset.mood = mood;
  if (duration > 0) {
    currentTimer = setTimeout(() => {
      currentFigure.dataset.mood = base;
    }, duration);
  }
}

export function mascotLine(page) {
  const pool = mascotLines[page] || mascotLines.home;
  const fresh = pool.filter(([, line]) => !recent.includes(line));
  const candidates = fresh.length
    ? fresh
    : pool.filter(([, line]) => line !== recent.at(-1));
  const chosen =
    candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
  recent = [...recent.slice(-3), chosen[1]];
  return chosen;
}
