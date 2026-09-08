export const vehicleDriveIn = {
  hidden: { x: 200, opacity: 0, rotateY: -15 },
  visible: {
    x: 0,
    opacity: 1,
    rotateY: 0,
    transition: { type: 'spring', stiffness: 80, damping: 15, mass: 0.8 },
  },
  exit: {
    x: -200,
    opacity: 0,
    rotateY: 15,
    transition: { duration: 0.4, ease: 'easeIn' },
  },
};

export const vehicleFloat = {
  animate: {
    y: [0, -8, 0],
    rotateZ: [0, 1, 0, -1, 0],
    transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
  },
};

export const vehicleSpin3D = {
  animate: {
    rotateY: [0, 360],
    transition: { repeat: Infinity, duration: 8, ease: 'linear' },
  },
};

export const perspectiveCard = {
  rest: { rotateX: 0, rotateY: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  hover: { rotateX: -5, rotateY: 5, scale: 1.02, transition: { duration: 0.3, ease: 'easeOut' } },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export const carDriveLeft = {
  hidden: { x: '110%', opacity: 0 },
  visible: {
    x: '0%',
    opacity: 1,
    transition: { type: 'spring', stiffness: 60, damping: 12, duration: 1.2 },
  },
};

export const carDriveRight = {
  hidden: { x: '-110%', opacity: 0 },
  visible: {
    x: '0%',
    opacity: 1,
    transition: { type: 'spring', stiffness: 60, damping: 12, duration: 1.2 },
  },
};

export const carPark = {
  hidden: { x: 100, opacity: 0, scale: 0.8 },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
};

export const neonPulse = {
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
  },
};

export const roadLine = {
  animate: {
    x: ['-100%', '100%'],
    transition: { repeat: Infinity, duration: 2, ease: 'linear' },
  },
};

export const wheelSpin = {
  animate: {
    rotate: 360,
    transition: { repeat: Infinity, duration: 1, ease: 'linear' },
  },
};

export const parallaxFloat = (speed: number) => ({
  animate: {
    y: [0, -10 * speed, 0],
    transition: { repeat: Infinity, duration: 5 + speed, ease: 'easeInOut' },
  },
});
