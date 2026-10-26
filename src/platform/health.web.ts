import type {Measurement} from '../data/types';
export async function openCultConnect(){window.open('https://play.google.com/store/apps/details?id=fit.cure.android.cswatch','_blank','noopener,noreferrer');}
export async function openHealthSettings(){throw new Error('Open Health Connect in Android Settings on your phone.');}
export async function readHealthMeasurements():Promise<Measurement[]>{throw new Error('Health Connect is available in the installed Android app.');}
