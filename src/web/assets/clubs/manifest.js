/** Local, reviewed club identity assets keyed by the event-data club name. */
export const clubAssets = Object.freeze({
  'ND Beltinci': '/assets/clubs/nd-beltinci.png',
  'NŠ Mura': '/assets/clubs/ns-mura.png',
  'NK Triglav Kranj': '/assets/clubs/nk-triglav-kranj.png',
  'Tabor Sežana': '/assets/clubs/nk-tabor-sezana.png',
  'ND Ilirija 1911': '/assets/clubs/nd-ilirija-1911.png'
});

export const clubAsset = (club) => clubAssets[club] || '';
