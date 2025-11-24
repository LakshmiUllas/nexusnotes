export const SUBJECT_COLORS = [
  'bg-red-800',
  'bg-orange-800',
  'bg-amber-700',
  'bg-yellow-700',
  'bg-lime-800',
  'bg-emerald-800',
  'bg-teal-800',
  'bg-cyan-800',
  'bg-sky-800',
  'bg-blue-800',
  'bg-indigo-900',
  'bg-violet-900',
  'bg-purple-900',
  'bg-fuchsia-900',
  'bg-rose-900',
  'bg-stone-600',
];

export const getRandomColor = () => {
  return SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];
};