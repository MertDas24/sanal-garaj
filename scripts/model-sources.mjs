// 3D model kaynak kayıtları.
// Bu dosya yalnızca model DOSYALARINI tanımlar; marka/model kataloğu src/data/catalog.ts içindedir.
//
// Alanlar:
//  - download: ham dosya adresi (.glb veya .gltf; yalnızca derleme betiği indirir). Sketchfab hesap
//      gerektirdiğinden, Sketchfab dışa aktarımlarının GitHub'daki herkese açık kopyaları kullanılır; dosyaya
//      gömülü kaynak adresi derlemede kayıttaki Sketchfab adresiyle karşılaştırılır
//  - source: nereden, kim tarafından, hangi lisansla geldiği (uygulamada ve CREDITS.md'de gösterilir)
//  - rotateY: aracın önü +Z yönüne bakacak şekilde Y ekseninde döndürme (radyan)
//  - lengthM: gerçek araç uzunluğu (metre); model bu uzunluğa ölçeklenir
//  - materials: kaynak malzeme adlarının kanonik rollere eşlenmesi
//      paint -> CG_paint (boyanabilir gövde), glass -> CG_glass, tire -> CG_tire, rim -> CG_rim
//  - paletteSplit: gövde rengini doku paletinde tutan modeller için; bu UV hücrelerine düşen
//      üçgenler ayrı CG_paint malzemesine taşınır (8x8 palet ızgarası, [sütun, satır, minY?], satır üstten).
//      color: dokudaki orijinal gövde renginin yaklaşığı (karşılaştırmadaki "önce" görünümü için).
//  - wheelNodes: tekerlek düğümleri (yükseklik ayarı ve jant modeli için ayrı olmalı)
//  - removeNodes: araca ait olmayan sahne parçaları (ör. sergi platformu)
//  - partNodes: modelin kendi içinde gelen, açılıp kapatılabilen gerçek parçalar
//  - mods: görsel olarak doğrulanmış eklenti parçası desteği (spoiler / ön lip)
//  - notes: doğrulama sırasında tespit edilen sınırlamalar
//  - wheelMaterials: bu malzemeleri kullanan düğümler tekerlek sayılır (en alçak 4 tekerlek; stepne hariç)
//  - wheelQuadrants: dört tekerleği tek düğümde tutan ağlar, aracın merkezine göre 4 parçaya bölünür
//  - simplify: üçgen sayısını bu orana indir (meshoptimizer); textureSize: en büyük doku boyutu (varsayılan 1024)
//  - autoWheels: lastik malzeme adları; tekerlekler otomatik ayrılır (bkz. build-models.mjs → autoWheels)
//  - autoWheelRadius: autoWheels silindir yarıçapı çarpanı (işaret malzemesi lastik değil jant kapağıysa >1)
//  - paintKeepMap: gövde dokusu korunur, seçilen renk dokuyla çarpılır (açık tabanlı, ayrıntılı gövde dokuları)
//  - paintColor: gövde dokusu boyaya uygun değilse düz boyaya çevrilir, başlangıç rengi bu olur
//
// Kaynak politikası: yalnızca CC0 / CC BY; lisans Sketchfab API’sinden doğrulanır; açıklamasında yeniden yükleme,
// oyundan aktarma veya başka yazara ait olduğu belirtilen modeller kullanılmaz (ayrıntı: AGENTS.md).
// Not (2026-10-12): Poly Pizza kaynaklı düşük poligonlu modeller, gerçekçi görünmedikleri için katalogdan kaldırıldı.

const SF = (uid) => `https://sketchfab.com/3d-models/${uid}`;
const CCBY4 = { license: 'CC-BY-4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' };
const GH = 'https://raw.githubusercontent.com/';

export const MODEL_SOURCES = [
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
  {
    id: 'volkswagen-passat-b55',
    download: `${GH}krisAndreev/MyMiniCar/bd2763216f78d734ad7fef4f13df08993c6bde0d/src/MyMiniCar.Web/wwwroot/models/vw-passat/scene.gltf`,
    source: { title: 'Volkswagen Passat', author: 'I3D', site: 'Sketchfab', url: SF('480c0793f02b43d78b0d0c4a0eb6acb6'), ...CCBY4 },
    rotateY: 0, lengthM: 4.7,
    materials: { paint: ['paint'], glass: ['glass'], tire: ['tyre'], rim: ['material'] },
    wheelQuadrants: ['Object_24', 'Object_19'],
    mods: { spoiler: false, frontLip: true },
  },
  {
    id: 'dodge-challenger-srt-hellcat',
    download: `${GH}jagriDev/A-FRAME/0fa0fd01e17cbe76af2b7f2d79ebbf037d760912/A-frame%20house/assets/models/Dodge/scene.gltf`,
    source: { title: "( FREE ) Dodge Challenger SRT", author: "SDC PERFORMANCE™️", site: 'Sketchfab', url: SF('38a1fd572beb433fa2d26d8c1070c8fa'), ...CCBY4 },
    rotateY: 0, lengthM: 5.02,
    materials: { paint: ['Carosserie'], glass: ['Glace'], tire: ['Tire'], rim: ['RIMS_BLACK'] },
    autoWheels: ['Tire'],
  },
  {
    id: 'jaguar-xj-x350',
    download: `${GH}meprashantsah/portfolio-website/dc3738784246266bb8aec513b5b29ede9d9fa28d/public/jaguar_xj6/scene.gltf`,
    source: { title: "2005 Jaguar XJ6 TDVi (X350)", author: "Fishboe", site: 'Sketchfab', url: SF('030d2d750085459aa169e6a187d4c37a'), ...CCBY4 },
    rotateY: 0, lengthM: 5.09,
    materials: { paint: ['Paint'], glass: ['Window', 'WindowDark'], tire: ['Tire'], rim: ['material'] },
    autoWheels: ['Tire'],
  },
  {
    id: 'aston-martin-db11',
    download: `${GH}cmourglia/spark-gl/62e30873256869d83bc206a9c4bcee8d3068a3da/resources/models/2017_aston_martin_db11_5.2l_twin-turbo_v12/scene.gltf`,
    source: { title: "2017 Aston Martin DB11 [5.2L Twin-Turbo V12]", author: "Hari Prasath R", site: 'Sketchfab', url: SF('936854ba7dde46f09a47d355d433808c'), ...CCBY4 },
    rotateY: Math.PI, lengthM: 4.74,
    simplify: 0.6,
    materials: { paint: ['Body_Color'], tire: ['Tire_Treads', 'Tire_Sidewall'] },
    notes: 'Sol ve sağ jantlar kaynakta farklı malzemeler kullandığı için jant rengi ve modeli kapalıdır.',
    autoWheels: ['Tire_Treads', 'Tire_Sidewall'],
  },
  {
    id: 'lamborghini-gallardo-2010',
    download: `${GH}mizanxali/r3f-demo/5c990206736bb2df9c1177bf7335f083431d50d7/public/lamborghini_gallardo_2010/scene.gltf`,
    source: { title: "Lamborghini Gallardo 2010", author: "Artem P", site: 'Sketchfab', url: SF('ff0eb2242d0e42eb8b7034b4db639e56'), ...CCBY4 },
    rotateY: 0, lengthM: 4.39,
    materials: { paint: ['paint'], glass: ['glass'], tire: ['tire'], rim: ['material'] },
    autoWheels: ['tire'],
    notes: 'Fren diski ve kaliper modeli, yazarın belirttiğine göre Velstyde’a aittir (aynı CC BY 4.0 Sketchfab modelinin parçası).',
  },
  {
    id: 'chevrolet-corvette-c7',
    download: `${GH}Tobee4Lin/tobee-website/7d571c4e3e41b80d4ad1043343edd662ba33f2ca/public/model/Chevrolet/scene.gltf`,
    source: { title: "Chevrolet Corvette (C7)", author: "Martin Trafas", site: 'Sketchfab', url: SF('2b509d1bce104224b147c81757f6f43a'), ...CCBY4 },
    rotateY: 0, lengthM: 4.49,
    simplify: 0.22,
    materials: { paint: ['Car_Paint'], glass: ['Windows'], tire: ['TireMaterial'], rim: ['material'] },
    autoWheels: ['TireMaterial'],
  },
  {
    id: 'fiat-uno-2001',
    download: `${GH}karlProbst/UnoAlado/655d91211a46c55fd116f2e6bb2ef97f3f61633a/assets/fiat_uno_2001/scene.gltf`,
    source: { title: "Fiat Uno 2001", author: "B.M.A", site: 'Sketchfab', url: SF('cf685e42e7b54f348f6d5c145f1175dc'), ...CCBY4 },
    rotateY: 0, lengthM: 3.69,
    materials: { paint: ['Material.004'] },
    paintKeepMap: true,
    autoWheels: ['Wheel'],
  },
  {
    id: 'hyundai-accent-tagaz',
    download: `${GH}mcihad/itfaiye-arac/42a0ad59accdac8cc5504b966f60e970ce54fa7d/public/3dmodels/hyundai_accent_tagaz_2004/scene.gltf`,
    source: { title: "Hyundai Accent (TaGAZ) 2004", author: "panderlaike_design", site: 'Sketchfab', url: SF('b00b5faebc314e54aef423e46230e963'), ...CCBY4 },
    rotateY: 0, lengthM: 4.24,
    simplify: 0.25,
    materials: { paint: ['Kuzov'], glass: ['Steklo'], rim: ['Kolpak'] },
    autoWheels: ['Kolpak'], autoWheelRadius: 1.35,
  },
  {
    id: 'ferrari-488-pista-widebody',
    download: `${GH}Uknowme-h/Operation-GearHead/6e5d02e53f5df2aef3e175dbbfe3787571d1251c/games/Assets/ferrari_488_pista_widebody/scene.gltf`,
    source: { title: "Ferrari 488 Pista Widebody", author: "Dev365TH", site: 'Sketchfab', url: SF('16c28f5b3ed24991ac3d1208f4a8bc1f'), ...CCBY4 },
    rotateY: -Math.PI / 2, lengthM: 4.7,
    materials: { paint: ['GREEN_car_paint'], tire: ['Tyre_Side', 'Tyre'], rim: ['material'] },
    autoWheels: ['Tyre_Side', 'Tyre'],
  },
  {
    id: 'hudson-hornet-1951',
    download: `${GH}dongxiaoman6/three3d/bb6685aef9f9a2452d5b7486239b14138fc89cd4/public/follower/scene.gltf`,
    source: { title: "800 Follower Special Hudson Hornet Downloadable", author: "Libau Media", site: 'Sketchfab', url: SF('d47d1f7f7e4b44e3b71aece76d5dabe9'), ...CCBY4 },
    rotateY: 0, lengthM: 5.26,
    materials: { paint: ['hudsonpaint'], glass: ['Glass'], tire: ['firestone_tyre'], rim: ['steelie_red'] },
    paintKeepMap: true,
    autoWheels: ['firestone_tyre'],
    notes: 'Gövde “Fabulous Hudson Hornet” yarış dekoruyla gelir; seçilen renk dekorun üzerine uygulanır.',
  },
  {
    id: 'chevrolet-malibu-1965',
    download: `${GH}joziasmartini/car-shop/6d1e862bc1d2b4e5057144e05692e3fdd3ab46d8/public/3d/65_chevy_malibu/scene.gltf`,
    source: { title: "'65 Chevy Malibu", author: "Joko_P", site: 'Sketchfab', url: SF('170df9c498a84dcea040985871ee4e67'), ...CCBY4 },
    rotateY: Math.PI, lengthM: 5,
    materials: { paint: ['Car_Paint'], glass: ['Window_Glass_Clear'], tire: ['Tires', 'Tires_Yellow'] },
    autoWheels: ['Tires'],
  },
  {
    id: 'willys-mb-jeep',
    download: `${GH}shahriarRaf/-3D-Military-Basecamp/44495d11062ac53cc562a0e4431cb96ef16f1dc8/jeep/scene.gltf`,
    source: { title: "Willy Jeep", author: "AnilG", site: 'Sketchfab', url: SF('b635f6d5a7a045cf9bae3cc71952cd23'), ...CCBY4 },
    rotateY: Math.PI, lengthM: 3.36,
    simplify: 0.4,
    materials: { paint: ['Jeep'], glass: ['Glass'], tire: ['Tyre'] },
    paintKeepMap: true,
    autoWheels: ['Tyre'],
    notes: 'Gövde askeri haki dokuyla gelir; seçilen renk dokunun üzerine uygulandığı için koyu tonlar oluşur.',
  },
  {
    id: 'lamborghini-centenario',
    download: `${GH}hfolcot/threejs_lambo/2c33d04fcd6d422a9990e6f88c612f4a37e708dd/assets/models/cars/centenario/scene.gltf`,
    source: { title: "( FREE ) Lamborghini Centenario LP-770", author: "SDC PERFORMANCE™️", site: 'Sketchfab', url: SF('f70732dbd53c4c9daef0b9904d51dd5a'), ...CCBY4 },
    rotateY: 0, lengthM: 4.92,
    simplify: 0.5,
    materials: { paint: ['Carbon_R'], tire: ['pneu.005'], rim: ['material'] },
    paintColor: '#1c1d20',
    notes: 'Gövde kaynakta karbon desenli dokuyla gelir; renk değiştirilebilsin diye düz boyaya çevrildi.',
    autoWheels: ['pneu.005'],
  },
  {
    id: 'nissan-gt-r-r35',
    download: `${GH}BenjaminContrerasFe/Proyecto-Grupo-Widi/a6692c026811fb395ec12b630a04ac90cf78ac3d/Modelos_3D/Gtr-35/scene.gltf`,
    source: { title: "Nissan GTR R35", author: "Ciasny", site: 'Sketchfab', url: SF('51c912a8310c4e00a82ad7673d84228a'), ...CCBY4 },
    rotateY: Math.PI / 2, lengthM: 4.71,
    simplify: 0.35,
    materials: { paint: ['CarPaint'] },
    autoWheels: ['Plastic.001'],
  },
  {
    id: 'honda-civic-type-r-fl5',
    download: `${GH}wagnerfgomes/projeto-faculdade-frontend-sitehondacivic/02e4d6cba213e8c65a5cfa85e0a6efe3b328d7d7/assets/modelo/scene.gltf`,
    source: { title: "Custom Honda Civic Type-R (2024)", author: "Jumping Jax", site: 'Sketchfab', url: SF('c36abddc783445fbb00f72356c576fca'), ...CCBY4 },
    rotateY: 0, lengthM: 4.59,
    simplify: 0.6,
    materials: { paint: ['Paintid9490011Mtl'], glass: ['Windshieldid1330011Mtl'], tire: ['Tyreid18260021Mtl', 'Tyre01id18260031Mtl', 'Tyre02003id18260211Mtl'], rim: ['Rimid18260041Mtl'] },
    autoWheels: ['Tyreid18260021Mtl', 'Tyre01id18260031Mtl', 'Tyre02003id18260211Mtl'],
  },
  {
    id: 'opel-calibra-1990',
    download: `${GH}Pegasg-ai/craft-deneme/d1059229a94d55af418cceb3cd294be59c05810f/assets/vehicles/opel%20calibra/scene.gltf`,
    source: { title: "Opel Calibra 1990", author: "Luquita", site: 'Sketchfab', url: SF('154f19805fbb4957b6aae8e3b23f9471'), ...CCBY4 },
    rotateY: 0, lengthM: 4.49,
    simplify: 0.25,
    materials: { paint: ['carpaint'], glass: ['windowglass'], tire: ['tire'], rim: ['material_15'] },
    autoWheels: ['tire'],
  },
];
