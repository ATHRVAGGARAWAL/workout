// Bluetooth SIG Weight Measurement characteristic 0x2A9D, SI / imperial.
// This parses only the published standard; it does not guess Cult's proprietary packets.
export type ScaleReading={weightKg:number;userId:number|null;bmi:number|null;heightCm:number|null;recordedAt:number};
export function decodeWeightMeasurement(bytes:Uint8Array):ScaleReading|null{
 if(bytes.length<3)return null;const flags=bytes[0];if(flags&0xF0)return null;
 const required=3+((flags&2)?7:0)+((flags&4)?1:0)+((flags&8)?4:0);if(bytes.length<required)return null;
 const uint16=(offset:number)=>bytes[offset]|bytes[offset+1]<<8;const raw=uint16(1);if(raw===65535)return null;const imperial=!!(flags&1);const kg=imperial?raw*0.01*0.45359237:raw*0.005;if(kg<20||kg>500)return null;
 let offset=3;let recordedAt=Date.now();if(flags&2){const year=uint16(offset);const month=bytes[offset+2],day=bytes[offset+3],hour=bytes[offset+4],minute=bytes[offset+5],second=bytes[offset+6];const d=new Date(year,month-1,day,hour,minute,second);if(year>=2000&&month>=1&&month<=12&&day>=1&&d.getDate()===day&&hour<24&&minute<60&&second<60)recordedAt=d.getTime();offset+=7;}
 const userId=flags&4?bytes[offset++]:null;let bmi:number|null=null,heightCm:number|null=null;if(flags&8){const b=uint16(offset)/10;const h=uint16(offset+2)*(imperial?0.254:0.1);bmi=b>0&&b<100?b:null;heightCm=h>=50&&h<=300?h:null;}
 return {weightKg:Math.round(kg*1000)/1000,userId:userId===255?null:userId,bmi,heightCm,recordedAt};
}
