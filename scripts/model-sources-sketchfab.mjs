// Yüksek detaylı modeller (Sketchfab, CC BY 4.0).
// Sketchfab doğrudan indirme için hesap ister; bu dosyalar, Sketchfab dışa aktarımının GitHub'daki herkese açık
// kopyalarından (mirror) indirilir. Her kopyanın içindeki gömülü kaynak adresi (asset.extras.source) derleme
// sırasında kayıttaki Sketchfab adresiyle karşılaştırılır; lisans Sketchfab API'sinden doğrulanmıştır.
// Alanların anlamı için model-sources.mjs başındaki açıklamaya bakın. Ek alanlar:
//  - wheelMaterials: bu malzemeleri kullanan düğümler tekerlek sayılır (en alçak 4 tekerlek; stepne hariç)
//  - wheelQuadrants: dört tekerleği tek düğümde tutan ağlar, aracın merkezine göre 4 parçaya bölünür
//  - simplify: üçgen sayısını bu orana indir (meshoptimizer); textureSize: en büyük doku boyutu (varsayılan 1024)

const SF = (uid) => `https://sketchfab.com/3d-models/${uid}`;
const CCBY4 = { license: 'CC-BY-4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' };
const GH = 'https://raw.githubusercontent.com/';

export const SKETCHFAB_SOURCES = [
  {
    id: 'mercedes-e-class-w212',
    download: `${GH}bujue600-arch/carVison/3a38b553a5fd49b4b18186f84ce83952c4277015/car-vision-frontend/public/models/mercedes-e-class/scene.gltf`,
    source: { title: 'Mercedes E Class W212', author: 'Peter_D', site: 'Sketchfab', url: SF('119c5e10733142b197aa53b86f6aeb04'), ...CCBY4 },
    rotateY: Math.PI, lengthM: 4.87, simplify: 0.4, textureSize: 512,
    materials: { paint: ['mat_body'], glass: ['mat_glass'], tire: ['mat_tires'], rim: ['mat_wheels'] },
    wheelMaterials: ['mat_wheels', 'mat_tires'],
    mods: { spoiler: false, frontLip: true },
  },
  {
    id: 'toyota-corolla-e180',
    download: `${GH}oddalan/three-dee/3ee1ecfc20c392513d780f4ff19ef4904d90f8dd/assets/models/corolla/scene.gltf`,
    source: { title: '2014 Toyota Corolla E180 EU (with interior)', author: 'Armored Wave', site: 'Sketchfab', url: SF('36f95efb0585464cae43a25a3b3392e8'), ...CCBY4 },
    rotateY: 0, lengthM: 4.62,
    materials: { paint: ['main_paint.001'], glass: ['Material.004'], tire: ['tyre_side'] },
    wheelQuadrants: ['corolla_e180_wheels'],
  },
  {
    id: 'mercedes-c63-amg-w204',
    download: `${GH}mstoyanov7/ModelViewer/3ecd0feb199c07e3b2173b96d89aa98a681cafac/assets/c63/scene.gltf`,
    source: { title: 'Mercedes Benz C63 AMG', author: 'LuizZed36', site: 'Sketchfab', url: SF('38eb721c70d34046a60ef7a8984024c5'), ...CCBY4 },
    rotateY: -Math.PI / 2, lengthM: 4.73,
    materials: { paint: ['CAR_BODY_PAINT'], glass: ['WINDOW_GLASS'], tire: ['TARMAC_TYRE_TREAD', 'TARMAC_TYRE_WALL'], rim: ['TARMAC_WHEEL'] },
    wheelQuadrants: ['Object_15', 'Object_13', 'Object_14', 'Object_6', 'Object_4'],
    mods: { spoiler: true, frontLip: false },
  },
  {
    id: 'mercedes-300ce-w124',
    download: `${GH}krisAndreev/MyMiniCar/bd2763216f78d734ad7fef4f13df08993c6bde0d/src/MyMiniCar.Web/wwwroot/models/mercedes-w124-300ce/scene.gltf`,
    source: { title: 'Mercedes w124 300ce', author: 'timmiethizz', site: 'Sketchfab', url: SF('54a881bc475f4aa089974a22e018c1d8'), ...CCBY4 },
    rotateY: Math.PI / 2, lengthM: 4.65,
    materials: { paint: ['material'] },
  },
  {
    id: 'toyota-land-cruiser-200',
    download: `${GH}lordkiki/threejs/1481dc94772e04b867f24f3920272c60f913be6a/LandCruiser/scene.gltf`,
    source: { title: 'Toyota_land_cruiser', author: 'Jean Wally’s™', site: 'Sketchfab', url: SF('5d9786f638b24c8ead09bb158dc8812d'), ...CCBY4 },
    rotateY: 0, lengthM: 4.95, simplify: 0.3,
    materials: {
      paint: ['Metal_Black_Dixon', ...['Object_26', 'Object_32', 'Object_78', 'Object_88', 'Object_133', 'Object_119'].map((n) => `Black_plastic_PL@${n}`)],
      glass: ['Glass.001'], tire: ['Tire'] },
    wheelMaterials: ['Tire', 'Metallic_0', 'Brake_Disc', 'BrakeCaliper', 'Rust'],
    notes: 'Ön ızgara modelde gövdeyle aynı parçada olduğu için gövde rengini alır. Jantlar farklı malzemeler kullandığından jant rengi ve modeli kapalıdır.',
  },
  {
    id: 'mercedes-300sl-gullwing',
    download: `${GH}pxAnmol/ThreeJs-R3F/22e3ae39ab6333da8896c70be3d15713b6acab42/3%20Advanced%20Techniques/5%20Realistic%20Render/public/mercedes_benz/scene.gltf`,
    source: { title: 'Mercedes-Benz 300sl Gullwing | www.vecarz.com', author: 'vecarz', site: 'Sketchfab', url: SF('65edd5814c9842bb9c769388d13fa27f'), ...CCBY4 },
    rotateY: -Math.PI / 2, lengthM: 4.52,
    materials: { paint: ['300sl_paintjob'], glass: ['300sl_glass'] },
    wheelQuadrants: ['Plane.151'],
  },
  {
    id: 'toyota-crown-super-deluxe',
    download: `${GH}fitra213/multiple-maker/ff7abc456313a6f3b858153d941a22693eea8537/assets/toyota_crown_super_deluxe_mild_hybrid/scene.gltf`,
    source: { title: 'Toyota Crown Super Deluxe Mild Hybrid', author: 'Andrasfi Games', site: 'Sketchfab', url: SF('6e357d856df44d98a615cac1d0c30b56'), ...CCBY4 },
    rotateY: 0, lengthM: 4.8,
    materials: { paint: ['Paint'], glass: ['Windshield'] },
    wheelQuadrants: ['Wheels_98', 'Wheel  Holder_97'],
  },
  {
    id: 'porsche-911-930-turbo',
    download: `${GH}PacktPublishing/Learn-Three.js-Fourth-edition/d0073491c5ac19d46a37cc7742855499b01bb17f/source/assets/gltf/porsche/scene.gltf`,
    source: { title: 'FREE 1975 Porsche 911 (930) Turbo', author: 'Lionsharp Studios', site: 'Sketchfab', url: SF('8568d9d14a994b9cae59499f0dbed21e'), ...CCBY4 },
    rotateY: 0, lengthM: 4.29, simplify: 0.6,
    removeNodes: ['Object_32'],
    materials: { paint: ['paint'], glass: ['glass'], tire: ['930_tire'], rim: ['930_rim'] },
    wheelMaterials: ['930_tire', '930_rim'],
    notes: 'Boyanın üzerindeki ayrı yarı saydam “vernik” katmanı, renk değişimini bozduğu için kaldırıldı.',
  },
  {
    id: 'toyota-ae86-trueno-zenki',
    download: `${GH}WatchDogStudios/JDebug/a090fa07a3c2baa286c6a3c33e2aa9382125d120/Data/Base/Meshes/Renders/toyota_ae86_sprinter_trueno_zenki/scene.gltf`,
    source: { title: 'Toyota AE86 Sprinter Trueno Zenki', author: 'Martin Trafas', site: 'Sketchfab', url: SF('a5737bf3cc9b4179a6e5ebe173ff70d9'), ...CCBY4 },
    rotateY: 0, lengthM: 4.18, simplify: 0.18,
    materials: { paint: ['Primary'], glass: ['Windows'], tire: ['TireMaterial'], rim: ['RimMaterial'] },
    wheelMaterials: ['TireMaterial', 'RimMaterial', 'Brake_Disc', 'BrakeCaliper'],
    mods: { spoiler: true, frontLip: true },
  },
  {
    id: 'bmw-m3-e30',
    download: `${GH}ArianitBalidemaj/PortWebsite/b54ba96366c280f91e20f6958266b15595d3419b/public/bmw/scene.gltf`,
    source: { title: '[FREE] BMW M3 E30', author: 'Martin Trafas', site: 'Sketchfab', url: SF('ac3c7013434e403e8faff87948caf422'), ...CCBY4 },
    rotateY: 0, lengthM: 4.35, simplify: 0.7,
    materials: { paint: ['BMW_E30_M3_PAINT'], glass: ['BMW_E30_M3_WINDOWS'], tire: ['BMW_E30_M3_TIRE'], rim: ['BMW_E30_M3_RIM'] },
    wheelMaterials: ['BMW_E30_M3_RIM', 'BMW_E30_M3_TIRE', 'Brake_Disc', 'Brembo_Calipers', 'Logo_Plane'],
    mods: { spoiler: false, frontLip: true },
  },
  {
    id: 'toyota-prius-2012',
    download: `${GH}SenzCode/DriveSaviour/9e5984ec4926c105e730a7976e8bcd6de60b31ca/vehicle_owner/shop/modify/toyota_prius/scene.gltf`,
    source: { title: 'Toyota Prius 2012', author: 'Doz3', site: 'Sketchfab', url: SF('04eaf6b288cc466785365b7d985e3b29'), ...CCBY4 },
    rotateY: Math.PI, lengthM: 4.48,
    materials: { paint: ['Color.002'], glass: ['Windows.002'], tire: ['Wheel0021Mtl.002', 'Wheel1Mtl'], rim: ['Rims.002'] },
    wheelQuadrants: ['Object_23', 'Object_24', 'Object_25'],
  },
];
