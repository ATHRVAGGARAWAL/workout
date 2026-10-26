import { Platform } from 'react-native';
import type { Measurement } from '../data/types';
import { localDate } from '../data/workout';
export async function openCultConnect(){if(Platform.OS!=='android')throw new Error('Open Cult Connect on your Android phone.');const {openApplication}=await import('expo-intent-launcher');await openApplication('fit.cure.android.cswatch');}
export async function openHealthSettings(){const hc=await import('react-native-health-connect');hc.openHealthConnectSettings();}
export async function readHealthMeasurements():Promise<Measurement[]>{
 if(Platform.OS!=='android')throw new Error('Health Connect is available in the installed Android app.');
 const hc=await import('react-native-health-connect');if(await hc.getSdkStatus()!==hc.SdkAvailabilityStatus.SDK_AVAILABLE)throw new Error('Health Connect is unavailable or needs an update on this phone.');if(!await hc.initialize())throw new Error('Could not initialize Health Connect.');
 const granted=await hc.requestPermission([{accessType:'read',recordType:'Weight'},{accessType:'read',recordType:'BodyFat'},{accessType:'read',recordType:'LeanBodyMass'}]);
 if(!granted.some(p=>p.recordType==='Weight'&&p.accessType==='read'))throw new Error('Allow weight access to preview measurements.');
 const range={operator:'between' as const,startTime:new Date(Date.now()-30*86400000).toISOString(),endTime:new Date().toISOString()};
 async function readAll<T extends 'Weight'|'BodyFat'|'LeanBodyMass'>(type:T){let token:string|undefined;const records:import('react-native-health-connect').RecordResult<T>[]=[];do{const result=await hc.readRecords(type,{timeRangeFilter:range,pageSize:500,pageToken:token});records.push(...result.records);token=result.pageToken??undefined;}while(token&&records.length<10000);return records;}
 const weights=await readAll('Weight');
 const fats=granted.some(p=>p.recordType==='BodyFat')?await readAll('BodyFat'):[];
 const lean=granted.some(p=>p.recordType==='LeanBodyMass')?await readAll('LeanBodyMass'):[];
 return weights.flatMap(weight=>{const kg=weight.weight.inKilograms;const at=Date.parse(weight.time);const source=weight.metadata?.dataOrigin??'Health Connect';const recordId=weight.metadata?.id;if(!recordId||!Number.isFinite(at)||!Number.isFinite(kg)||kg<20||kg>500)return [];
  const near=<T extends {time:string;metadata?:{dataOrigin?:string}}>(items:T[])=>items.filter(item=>item.metadata?.dataOrigin===source&&Math.abs(Date.parse(item.time)-at)<120000).sort((a,b)=>Math.abs(Date.parse(a.time)-at)-Math.abs(Date.parse(b.time)-at))[0];
  const fat=near(fats)?.percentage;const mass=near(lean)?.mass.inKilograms;
  return [{id:`hc:${recordId}`,date:localDate(at),weightKg:kg,waistCm:null,notes:'Imported from Health Connect',source,sourceId:`hc:${recordId}`,recordedAt:at,bodyFatPercent:fat!==undefined&&fat>=1&&fat<=75?fat:null,leanMassKg:mass!==undefined&&mass>=1&&mass<=300?mass:null}];
 }).sort((a,b)=>(b.recordedAt??0)-(a.recordedAt??0));
}
