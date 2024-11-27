import {NativeModules} from 'react-native';
const {TMap} = NativeModules;

//public void openNavi(String rGoName, String rGoLongitude, String rGoLatitude, @Nullable String rV1Name, @Nullable String rV1Longitude, @Nullable String rV1Latitude, @Nullable String rV2Name, @Nullable String rV2Longitude, @Nullable String rV2Latitude, @Nullable String rV3Name, @Nullable String rV3Longitude, @Nullable String rV3Latitude, Promise promise) {
interface TMapInterface {
  openNavi(
    rGoName: string,
    rGoLongitude: string,
    rGoLatitude: string,
    rV1Name: string,
    rV1Longitude: string,
    rV1Latitude: string,
    rV2Name: string | null,
    rV2Longitude: string | null,
    rV2Latitude: string | null,
    rV3Name: string | null,
    rV3Longitude: string | null,
    rV3Latitude: string | null,
  ): Promise<boolean>;
}
export default TMap as TMapInterface;
