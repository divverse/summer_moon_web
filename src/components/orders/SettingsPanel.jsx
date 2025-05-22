import React from "react";
import { toast } from "react-toastify";

const SettingsPanel = ({ savedSettings, updatesettings }) => {
  return (
    <div className='absolute right-0 top-[3rem] bg-white shadow-lg rounded p-4 w-[250px]'>
      <h3 className='text-sm font-semibold'>Settings</h3>
      <div className='flex items-center gap-2 mt-2'>
        <input
          type='checkbox'
          id='auto'
          value={savedSettings.recording ?? "VAD"}
          checked={savedSettings.recording === "VAD"}
          onChange={() => {
            const newRecording = savedSettings.recording === "MANUAL" ? "VAD" : "MANUAL";
            const settings = { ...savedSettings, recording: newRecording };
            updatesettings(settings, {
              onSuccess: () => {
                toast.info("Audio options changed");
              },
              onError: () => {
                toast.error("Something went wrong");
              },
            });
          }}
        />
        <label htmlFor='auto' className='text-xs font-medium'>
          Automatic Voice Detection
        </label>
      </div>
      <div className='flex items-center gap-2 mt-2'>
        <input
          type='checkbox'
          id='auto'
          value={savedSettings.order ?? "AUTO"}
          checked={savedSettings.order === "AUTO"}
          onChange={() => {
            const newOrder = savedSettings.order === "MANUAL" ? "AUTO" : "MANUAL";
            const settings = { ...savedSettings, order: newOrder };
            updatesettings(settings, {
              onSuccess: () => {
                toast.info("Order options changed");
              },
              onError: () => {
                toast.error("Something went wrong");
              },
            });
          }}
        />
        <label htmlFor='auto' className='text-xs font-medium'>
          Automatic Order
        </label>
      </div>
      <div className='flex items-center gap-2 mt-2'>
        <input
          type='checkbox'
          id='auto'
          value={savedSettings.speech ?? true}
          checked={savedSettings.speech}
          onChange={() => {
            const newSpeech = savedSettings.speech ? false : true;
            const settings = { ...savedSettings, speech: newSpeech };
            updatesettings(settings, {
              onSuccess: () => {
                toast.info("Speech options changed");
              },
              onError: () => {
                toast.error("Something went wrong");
              },
            });
          }}
        />
        <label htmlFor='auto' className='text-xs font-medium'>
          Enable AI Speech
        </label>
      </div>
    </div>
  );
};

export default SettingsPanel;
