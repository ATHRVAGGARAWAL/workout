import {router} from 'expo-router';
import {Screen,Heading,Button} from '../components/ui';
export default function NotFound(){return <Screen><Heading title="Let's head back." subtitle="This page isn't available."/><Button label="Back to training" onPress={()=>router.replace('/')}/></Screen>;}
