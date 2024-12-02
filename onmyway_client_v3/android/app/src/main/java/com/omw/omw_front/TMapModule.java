package com.omw.omw_front;

import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.skt.Tmap.TMapTapi;
import org.jetbrains.annotations.NotNull;
import androidx.annotation.Nullable;
import java.util.HashMap;

public class TMapModule extends ReactContextBaseJavaModule {
    TMapModule(ReactApplicationContext context) {
        super(context);
        // 모듈 로딩 시 실행되는 부분
        TMapTapi tMapTapi = new TMapTapi(context);
        tMapTapi.setSKTMapAuthentication("WLG4dZshW47YYFpEyRAlD9n4RstXeFkC8ICV2tJq"); // 여기에 여러분의 키 넣을 것
    }

    @NotNull
    @Override
    public String getName() {
        return "TMap";
    }

    @ReactMethod
    public void openNavi(String rGoName, String rGoLongitude, String rGoLatitude, @Nullable String rV1Name, @Nullable String rV1Longitude, @Nullable String rV1Latitude, @Nullable String rV2Name, @Nullable String rV2Longitude, @Nullable String rV2Latitude, @Nullable String rV3Name, @Nullable String rV3Longitude, @Nullable String rV3Latitude, Promise promise) {
        TMapTapi tMapTapi = new TMapTapi(getReactApplicationContext());
        boolean isTMapApp = tMapTapi.isTmapApplicationInstalled();
        if (isTMapApp) {
            HashMap pathInfo = new HashMap();
            pathInfo.put("rGoName", rGoName);
            pathInfo.put("rGoX", rGoLongitude);
            pathInfo.put("rGoY", rGoLatitude);
            pathInfo.put("rSOpt", "0");
            if (rV1Name != null && rV1Longitude != null && rV1Latitude != null) {
                pathInfo.put("rV1Name", rV1Name);
                pathInfo.put("rV1X", rV1Longitude);
                pathInfo.put("rV1Y", rV1Latitude);
            }
            if (rV2Name != null && rV2Longitude != null && rV2Latitude != null) {
                pathInfo.put("rV2Name", rV2Name);
                pathInfo.put("rV2X", rV2Longitude);
                pathInfo.put("rV2Y", rV2Latitude);
            }
            if (rV3Name != null && rV3Longitude != null && rV3Latitude != null) {
                pathInfo.put("rV3Name", rV3Name);
                pathInfo.put("rV3X", rV3Longitude);
                pathInfo.put("rV3Y", rV3Latitude);
            }
            boolean result = tMapTapi.invokeRoute(pathInfo);
            if (result) {
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } else {
            promise.resolve(false);
        }
    }
}
