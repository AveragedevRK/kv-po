import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://jnmbqnfuouuwzkfzvunh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpubWJxbmZ1b3V1d3prZnp2dW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjExNDQsImV4cCI6MjA4MjgzNzE0NH0.D3kkMp80ll4_QnBcXB-SSZSy5M8b55nwNwfmGQnrozI';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1️⃣ Session Setup (Module Level - Persists in Memory)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const SESSION_ID = generateUUID();
const SESSION_START = Date.now();

// Main entry point
export function initializeTelemetry() {
  // 1. Big JSON Snapshot (telemetry_logs)
  collectAndSendSnapshot();
  
  // 2. Page Load Event (telemetry_events)
  logPageLoad();
  
  // 3. Click Tracking (telemetry_events)
  setupClickTracking();
  
  // 4. Heartbeat (telemetry_events)
  setupHeartbeat();
}

// 2️⃣ Log page load (CONFIRM PIPELINE)
function logPageLoad() {
  supabase
    .from('telemetry_events')
    .insert({
      session_id: SESSION_ID,
      event_type: 'page_load',
      page_url: window.location.href,
      created_at: new Date().toISOString()
    })
    .then(({ error }) => {
      if (error) console.error('[Telemetry] Page load insert failed', error);
      else console.log('[Telemetry] Page load logged');
    });
}

// 3️⃣ Click tracking (SIMPLE, NO ASYNC AWAIT)
function setupClickTracking() {
  document.addEventListener('click', (e: any) => {
    // Basic safe extraction of properties
    const target = e.target;
    const tagName = target?.tagName ?? null;
    const id = target?.id ?? null;
    
    // Handle className safely (it can be an object for SVGs)
    let className = null;
    if (target?.className) {
      className = typeof target.className === 'string' 
        ? target.className 
        : (target.className.baseVal ?? null);
    }

    const innerText = target?.innerText?.slice(0, 100) ?? null;

    supabase
      .from('telemetry_events')
      .insert({
        session_id: SESSION_ID,
        event_type: 'click',
        page_url: window.location.href,
        tag_name: tagName,
        element_id: id,
        element_class: className,
        inner_text: innerText,
        x: e.clientX,
        y: e.clientY,
        created_at: new Date().toISOString()
      })
      .then(() => {}, () => { /* Fail silently */ });
  });
}

// 4️⃣ Time-on-page (NO ASYNC, Heartbeat)
function setupHeartbeat() {
  setInterval(() => {
    const duration_ms = Date.now() - SESSION_START;
    
    supabase
      .from('telemetry_events')
      .insert({
        session_id: SESSION_ID,
        event_type: 'heartbeat',
        page_url: window.location.href,
        duration_ms: duration_ms,
        created_at: new Date().toISOString()
      })
      .then(() => {}, () => { /* Fail silently */ });
  }, 10000); // Every 10 seconds
}

// ---------------------------------------------------------
// Original Snapshot Logic (Keep as requested for telemetry_logs)
// ---------------------------------------------------------
async function collectAndSendSnapshot() {
  const payload: any = {
    timestamp: new Date().toISOString(),
  };

  const safeFetch = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return { error: `HTTP ${res.status}`, url };
      return await res.json();
    } catch (e: any) {
      return { error: e.message || 'Fetch failed', url };
    }
  };

  try {
    // Gather all data in parallel
    const promises = [
      safeFetch('https://api.ipify.org?format=json').then(res => payload.ipify = res),
      safeFetch('https://ipapi.co/json/').then(res => payload.ipapi = res),
      safeFetch('https://ipinfo.io/json?token=YOUR_TOKEN').then(res => payload.ipinfo = res),
      safeFetch('https://api.ipdata.co/?api-key=YOUR_KEY').then(res => payload.ipdata = res),
      safeFetch('https://api.ipregistry.co/?key=YOUR_KEY').then(res => payload.ipregistry = res)
    ];

    // Navigator
    const nav: any = {};
    for (const key in navigator) {
      try {
        const val = (navigator as any)[key];
        if (typeof val !== 'function') nav[key] = val;
      } catch (e) {}
    }
    payload.navigator = nav;

    // UA Data
    if ((navigator as any).userAgentData) {
      try {
         payload.userAgentData = {
           basic: {
             brands: (navigator as any).userAgentData.brands,
             mobile: (navigator as any).userAgentData.mobile,
             platform: (navigator as any).userAgentData.platform,
           },
           highEntropy: "Pending..."
         };
         promises.push(
           (navigator as any).userAgentData.getHighEntropyValues([
             "architecture", "bitness", "model", "platformVersion", "uaFullVersion", "fullVersionList"
           ]).then((res: any) => {
             if(payload.userAgentData) payload.userAgentData.highEntropy = res;
           }).catch((e: any) => {
             if(payload.userAgentData) payload.userAgentData.highEntropy = { error: e };
           })
         );
      } catch (e) { payload.userAgentData = { error: e }; }
    } else {
      payload.userAgentData = "Unavailable";
    }

    // Screen/Window
    payload.screen = {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      orientation: (window.screen.orientation || {}).type || "Unavailable"
    };

    payload.window = {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      devicePixelRatio: window.devicePixelRatio,
    };

    // Time/Intl
    try {
      payload.time = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        offset: new Date().getTimezoneOffset(),
      };
    } catch(e) { payload.time = "Error"; }

    // Battery
    if ((navigator as any).getBattery) {
      promises.push((navigator as any).getBattery().then((b: any) => {
        payload.battery = { charging: b.charging, level: b.level };
      }).catch(() => payload.battery = "Failed"));
    }

    // Network
    if ((navigator as any).connection) {
       const c = (navigator as any).connection;
       payload.network = { effectiveType: c.effectiveType, rtt: c.rtt, downlink: c.downlink, saveData: c.saveData };
    }

    // WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debug = (gl as any).getExtension('WEBGL_debug_renderer_info');
        payload.gpu = {
           vendor: (gl as any).getParameter((gl as any).VENDOR),
           renderer: (gl as any).getParameter((gl as any).RENDERER),
           unmaskedVendor: debug ? (gl as any).getParameter(debug.UNMASKED_VENDOR_WEBGL) : "Unavailable",
           unmaskedRenderer: debug ? (gl as any).getParameter(debug.UNMASKED_RENDERER_WEBGL) : "Unavailable"
        };
      }
    } catch(e) { payload.gpu = "Error"; }

    // Wait for all
    await Promise.allSettled(promises);

    // Insert Snapshot (Once)
    await supabase.from('telemetry_logs').insert({
      session_id: SESSION_ID,
      payload
    });

  } catch (err) {
    console.error('Telemetry snapshot failed', err);
  }
}