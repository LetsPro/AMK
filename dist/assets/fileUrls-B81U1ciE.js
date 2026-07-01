import{c as i,s as d}from"./index-CWFM_Clj.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]],g=i("Download",u);async function l(r){var e,s;const a=r.public_url??"";if(r.bucket&&r.storage_path){const t=d.storage.from(r.bucket),c=r.display_name??r.original_name??void 0,[n,o]=await Promise.all([t.createSignedUrl(r.storage_path,1800),t.createSignedUrl(r.storage_path,1800,{download:c})]);return{preview_url:!n.error&&((e=n.data)!=null&&e.signedUrl)?n.data.signedUrl:a,download_url:!o.error&&((s=o.data)!=null&&s.signedUrl)?o.data.signedUrl:a}}return{preview_url:a,download_url:a}}async function y(r){return Promise.all(r.map(async a=>{if(!a.file)return a;const e=await l(a.file);return{...a,file:{...a.file,...e}}}))}async function w(r){return Promise.all(r.map(async a=>({...a,...await l(a)})))}export{g as D,y as a,w as b};
