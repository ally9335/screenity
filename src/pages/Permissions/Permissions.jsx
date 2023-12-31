import { check } from "prettier";
import React, { useEffect, useState, useRef, useCallback } from "react";

const Recorder = () => {
  useEffect(() => {
    window.parent.postMessage(
      {
        type: "screenity-permissions-loaded",
      },
      "*"
    );
  }, []);

  const checkPermissions = async () => {
    // Individually check the camera and microphone permissions using the Permissions API. Then enumerate devices respectively.
    try {
      const cameraPermission = await navigator.permissions.query({
        name: "camera",
      });
      const microphonePermission = await navigator.permissions.query({
        name: "microphone",
      });

      cameraPermission.onchange = () => {
        checkPermissions();
      };

      microphonePermission.onchange = () => {
        checkPermissions();
      };

      // If the permissions are granted, enumerate devices
      if (
        cameraPermission.state === "granted" &&
        microphonePermission.state === "granted"
      ) {
        enumerateDevices();
      } else {
        // Post message to parent window
        window.parent.postMessage(
          {
            type: "screenity-permissions",
            success: false,
            error: err.name,
          },
          "*"
        );
        // sendResponse({ success: false, error: err.name });
      }
    } catch (err) {
      enumerateDevices();
    }
  };

  // Enumerate devices
  const enumerateDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const devicesInfo = await navigator.mediaDevices.enumerateDevices();

      // Filter by audio input
      const audioinput = devicesInfo
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label,
        }));

      // Filter by audio output and extract relevant properties
      const audiooutput = devicesInfo
        .filter((device) => device.kind === "audiooutput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label,
        }));

      // Filter by video input and extract relevant properties
      const videoinput = devicesInfo
        .filter((device) => device.kind === "videoinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label,
        }));

      // Save in Chrome local storage
      chrome.storage.local.set({
        // Set available devices
        audioInput: audioinput,
        audioOutput: audiooutput,
        videoInput: videoinput,
      });

      // Post message to parent window
      window.parent.postMessage(
        {
          type: "screenity-permissions",
          success: true,
          audioinput,
          audiooutput,
          videoinput,
        },
        "*"
      );

      //sendResponse({ success: true, audioinput, audiooutput, videoinput });

      // End the stream
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    } catch (err) {
      // Post message to parent window
      window.parent.postMessage(
        {
          type: "screenity-permissions",
          success: false,
          error: err.name,
        },
        "*"
      );
      //sendResponse({ success: false, error: err.name });
    }
  };

  // const onMessage = useCallback((request, sender, sendResponse) => {
  //   // Get permissions and send response
  //   if (request.type === "get-permissions") {
  //     // Check if the sender is the parent window
  //     checkPermissions(sendResponse);

  //     return true;
  //   }
  // });

  // Post message listener
  useEffect(() => {
    window.addEventListener("message", (event) => {
      if (event.data.type === "screenity-get-permissions") {
        checkPermissions();
      }
    });
  }, []);

  // useEffect(() => {
  //   // Event listener (extension messaging)
  //   chrome.runtime.onMessage.addListener(onMessage);

  //   return () => {
  //     chrome.runtime.onMessage.removeListener(onMessage);
  //   };
  // }, []);

  return <div></div>;
};

export default Recorder;