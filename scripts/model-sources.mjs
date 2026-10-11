// 3D model kaynak kayıtları.
// Bu dosya yalnızca model DOSYALARINI tanımlar; marka/model kataloğu src/data/catalog.ts içindedir.
//
// Alanlar:
//  - download: ham GLB adresi (yalnızca derleme betiği indirir; tarayıcı bu adrese gitmez)
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

const PP = (id) => `https://poly.pizza/m/${id}`;
const STATIC = (res) => `https://static.poly.pizza/${res}.glb`;
const CCBY3 = { license: 'CC-BY-3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' };
const HALF_PI = Math.PI / 2;

export const MODEL_SOURCES = [
  {
    id: 'dodge-challenger-2015',
    download: STATIC('c2ae6507-7a82-4b1c-a8cd-d7bfa6378a21'),
    source: { title: '2015 Dodge Challenger', author: 'Grzybek', site: 'Poly Pizza', url: PP('1jB8I4t5w4'), ...CCBY3 },
    rotateY: 0, lengthM: 5.03,
    materials: { paint: ['Body'], glass: ['Windows.002'], tire: ['Tire 0', 'Tire 1'], rim: ['Middle'] },
    wheelNodes: ['Wheel.001', 'Wheel.002', 'Wheel.003', 'Wheel.004'],
    mods: { spoiler: true, frontLip: true },
  },
  {
    id: 'delorean-dmc12',
    download: STATIC('286c45cb-ffe7-47f4-94aa-f80267416164'),
    source: { title: 'DeLorean DMC-12', author: 'David Sirera', site: 'Poly Pizza', url: PP('1uZKezeldGG'), ...CCBY3 },
    rotateY: 0, lengthM: 4.27,
    materials: { paint: ['Chasis'], glass: ['glass'], tire: ['tire', 'tire.001', 'tire.002', 'tire.003'], rim: ['trim', 'trim.001', 'trim.002', 'trim.003'] },
    wheelNodes: ['Wheel_fl_Circle', 'Wheel_rl_Circle.001', 'Wheel_rr_Circle.002', 'Wheel_fr_Circle.003'],
    mods: { spoiler: true, frontLip: true },
  },
  {
    id: 'mini-classic',
    download: STATIC('e999a7af-291b-4c65-a46b-409493490e28'),
    source: { title: 'Low Poly Mini Cooper', author: 'Gilang Romadhan', site: 'Poly Pizza', url: PP('2whNujq5rNd'), ...CCBY3 },
    rotateY: 0, lengthM: 3.05,
    removeNodes: ['Cylinder_Cylinder.001'],
    materials: { paint: ['Paint'], glass: ['Kaca'] },
    notes: 'Tekerlekler gövdeyle tek parça; jant rengi, jant modeli ve yükseklik ayarı desteklenmez. Kaynak dosyadaki sergi platformu kaldırıldı.',
  },
  {
    id: 'rolls-royce-classic',
    download: STATIC('1d9ec236-045a-44e6-8805-048378d618d8'),
    source: { title: 'Rolls Royce', author: 'David Sirera', site: 'Poly Pizza', url: PP('3DtJTlxgO_U'), ...CCBY3 },
    rotateY: 0, lengthM: 5.17,
    materials: { paint: ['car'], glass: ['glass'], tire: ['tire', 'tire.001', 'tire.002', 'tire.003'], rim: ['grey', 'grey.001', 'grey.002', 'grey.003'] },
    wheelNodes: ['wheel1_Circle.001', 'wheel1.001_Circle.002', 'wheel1.002_Circle.003', 'wheel1.003_Circle.004'],
    mods: { spoiler: false, frontLip: false },
    notes: 'Kaynak, modelin hangi Rolls-Royce olduğunu belirtmiyor; katalogda “klasik coupe” olarak gösterilir.',
  },
  {
    id: 'dodge-charger-1969',
    download: STATIC('87d07a91-9367-402b-ac76-205fa4e3271b'),
    source: { title: 'Dodge Charger', author: 'David Sirera', site: 'Poly Pizza', url: PP('4b80hRVxqvv'), ...CCBY3 },
    rotateY: 0, lengthM: 5.28,
    materials: { paint: ['Red_Chasis'], glass: ['glass'], tire: ['tire'], rim: ['grey'] },
    wheelNodes: ['Circle.001', 'Circle.002', 'Circle.003', 'Circle.004'],
    mods: { spoiler: true, frontLip: true },
  },
  {
    id: 'mitsubishi-l200',
    download: STATIC('ecae441a-cba8-4dd6-9795-207a72d7e88e'),
    source: { title: 'Mitsubishi L200', author: 'Muhammad Reyhan', site: 'Poly Pizza', url: PP('4qjS9tFhsJg'), ...CCBY3 },
    rotateY: 0, lengthM: 5.0,
    materials: { paint: ['M_0136_Charcoal'], tire: ['M_0137_Black'], rim: ['Color_M06'] },
    wheelNodes: ['Mesh3 Model', 'Mesh5 Model', 'Mesh6 Model', 'Mesh7 Model'],
  },
  {
    id: 'chevrolet-camaro-zl1-2017',
    download: STATIC('364fcbe6-e60d-4774-87bf-02e31e2e20c7'),
    source: { title: 'Camaro ZL1 2017', author: 'Kris Tong', site: 'Poly Pizza', url: PP('7bF7UVAoYRG'), ...CCBY3 },
    rotateY: -HALF_PI, lengthM: 4.79,
    materials: { paint: ['mat8'] },
    notes: 'Tek parça model; cam, lastik ve jant ayrı düğüm değil. Yalnızca gövde boyası desteklenir.',
  },
  {
    id: 'toyota-hilux-1997',
    download: STATIC('bf727d4a-f5ad-4b53-ac33-272a477d19f4'),
    source: { title: 'Toyota Hilux 97', author: 'Muhammad Reyhan', site: 'Poly Pizza', url: PP('8-0nFArehjd'), ...CCBY3 },
    rotateY: Math.PI, lengthM: 4.9,
    materials: { paint: ['M_0042_Sienna'], glass: ['M_0129_WhiteSmoke'], tire: ['M_0137_Black'], rim: ['M_0135_DarkGray'] },
    wheelNodes: ['Mesh2 Model', 'Mesh3 Model', 'Mesh4 Model', 'Mesh5 Model'],
  },
  {
    id: 'range-rover-classic',
    download: STATIC('139b654a-14c7-4483-960a-5a02615e1af7'),
    source: { title: 'Range Rover', author: 'IvOfficial', site: 'Poly Pizza', url: PP('8zk4o6nALW'), ...CCBY3 },
    rotateY: 0, lengthM: 4.45,
    paletteSplit: { cells: [[5, 3], [4, 3], [6, 3]], color: '#9c6b45' },
    materials: { glass: ['Glass'] },
    wheelNodes: ['Tire1', 'Tire2', 'Tire3', 'Tire4'],
  },
  {
    id: 'mazda3-hatchback-2019',
    download: STATIC('61b05999-8b17-4af1-a70c-8725e822f1e5'),
    source: { title: 'Sports Hatchback', author: 'ReppenThe303', site: 'Poly Pizza', url: PP('DobtD8JyoW'), ...CCBY3 },
    rotateY: 0, lengthM: 4.46,
    materials: { paint: ['Mat_M3Body'], glass: ['Window glass'], tire: ['MatRubber'], rim: ['Rim'] },
    wheelNodes: ['Rim1', 'Rim1.001', 'Rim1.002', 'Rim1.003', 'Rubber', 'Rubber.010', 'Rubber.011', 'Rubber.012'],
    mods: { spoiler: false, frontLip: true },
    notes: 'Kaynak başlığı “Sports Hatchback”; dosyadaki düğüm ve malzeme adları (Mazda3Hatchback, Mat_M3Body) modelin Mazda3 Hatchback olduğunu gösterir.',
  },
  {
    id: 'tesla-cybertruck',
    download: STATIC('bd53628e-9ef8-4809-a8e1-8aa680186d0f'),
    source: { title: 'Cybertruck', author: 'Mobolaji', site: 'Poly Pizza', url: PP('Jpar3f32mt'), ...CCBY3 },
    rotateY: Math.PI, lengthM: 5.68,
    materials: { paint: ['Material.001'], glass: ['Material.002'], tire: ['tire'], rim: ['plates'] },
    wheelNodes: ['Sphere.001', 'Sphere.002', 'Sphere.003', 'Sphere.004'],
  },
  {
    id: 'mazda-rx7-fc',
    download: STATIC('69f2fddf-f111-4baf-93be-24ba26111602'),
    source: { title: 'Mazda RX-7', author: 'IvOfficial', site: 'Poly Pizza', url: PP('SnIoWlh7S2'), ...CCBY3 },
    rotateY: 0, lengthM: 4.29,
    materials: { paint: ['Body_paint'], glass: ['Glass'], rim: ['Rims'] },
    wheelNodes: ['FL_WHEEL', 'FR_WHEEL', 'RL_WHEEL', 'RR_WHEEL'],
    mods: { spoiler: true, frontLip: true },
  },
  {
    id: 'toyota-ae86',
    download: STATIC('a8c624d0-fb82-41c9-b5f4-0bb77d62d56a'),
    source: { title: 'Toyota AE86', author: 'IvOfficial', site: 'Poly Pizza', url: PP('ZEFWmOPSgh'), ...CCBY3 },
    rotateY: 0, lengthM: 4.2,
    paletteSplit: { cells: [[1, 0], [2, 0, 0.4]], nodes: ['Car'], color: '#e8e8e6' },
    materials: {},
    wheelNodes: ['Wheel1', 'Wheel2', 'Wheel3', 'Wheel4'],
    mods: { spoiler: true, frontLip: true },
    notes: 'Gövde rengi doku paletindeydi; derleme sırasında üst gövde rengi ayrı boya malzemesine ayrıldı. Alt gövdedeki siyah iki ton boyama korunur.',
  },
  {
    id: 'ford-model-t',
    download: STATIC('963e2a04-dc98-44ff-a169-8161bb9e9787'),
    source: { title: 'Ford Model T', author: 'Bruno Oliveira', site: 'Poly Pizza', url: PP('aJVM4rmsGIb'), ...CCBY3 },
    rotateY: -HALF_PI, lengthM: 3.4,
    materials: { paint: ['mat16'] },
    notes: 'Tek parça model; yalnızca gövde boyası desteklenir.',
  },
  {
    id: 'nissan-skyline-gtr-r34',
    download: STATIC('570c324d-029d-4cb1-b6fe-48a66a39d147'),
    source: { title: 'Nissan GTR', author: 'David Sirera', site: 'Poly Pizza', url: PP('a_HKCtYAv2W'), ...CCBY3 },
    rotateY: 0, lengthM: 4.6,
    materials: { paint: ['chasis', 'chasis_NONE'], glass: ['glass'], tire: ['tire'], rim: ['rim'] },
    wheelNodes: ['Circle', 'Circle.001', 'Circle.002', 'Circle.003'],
    mods: { spoiler: false, frontLip: true },
    notes: 'Kaynak başlığı “Nissan GTR”; görünüm R34 Skyline GT-R ile uyumludur. Model kendi arka kanadıyla gelir.',
  },
  {
    id: 'nissan-180sx',
    download: STATIC('ee0122dc-139e-4632-88e5-e4a099b279e9'),
    source: { title: '1994 Nissan 180MX', author: 'Grzybek', site: 'Poly Pizza', url: PP('c7vlPQ8dlt'), ...CCBY3 },
    rotateY: 0, lengthM: 4.52,
    materials: { paint: ['Body.001'], glass: ['Windows'], tire: ['Details 0'], rim: ['Details 1.001'] },
    wheelNodes: ['Cylinder', 'Cylinder.001', 'Cylinder.002', 'Cylinder.005'],
    mods: { spoiler: true, frontLip: true },
    notes: 'Kaynak başlığı “1994 Nissan 180MX”; görünüm Nissan 180SX ile uyumludur.',
  },
  {
    id: 'jeep-wrangler-unlimited',
    download: STATIC('ff67bb75-af41-4adb-b843-71b28a5a494e'),
    source: { title: "Mom's Wrangler", author: 'Anonim (Poly by Google arşivi)', site: 'Poly Pizza', url: PP('dWwNyqBmMvU'), ...CCBY3 },
    rotateY: 0, lengthM: 4.75,
    materials: { paint: ['mat21'] },
    notes: 'Tek parça model; yalnızca gövde boyası desteklenir. Yazar Poly Pizza\'da “Anonymous” olarak listelenir.',
  },
  {
    id: 'nissan-terrano',
    download: STATIC('fe18e8b7-852a-425c-9b4b-a2b25dc191b7'),
    source: { title: 'Terrano', author: 'Muhammad Reyhan', site: 'Poly Pizza', url: PP('fWGNi96ckzn'), ...CCBY3 },
    rotateY: -HALF_PI, lengthM: 4.37,
    materials: { paint: ['Color_I07'], tire: ['ban'] },
    wheelNodes: ['Mesh2 Component_1_1 Model', 'Mesh3 Component_1_1 Model', 'Mesh4 Component_1_1 Model', 'Mesh5 Component_1_1 Model'],
    notes: 'Jantlar tamponlarla aynı malzemeyi paylaşır; jant rengi desteklenmez.',
  },
  {
    id: 'chevrolet-camaro-2010',
    download: STATIC('b99378ae-e2af-4eae-bb60-1c9f8ab09573'),
    source: { title: 'Chevrolet Camaro', author: 'PuKkBuMXDD', site: 'Poly Pizza', url: PP('kVcKsd2dEk'), ...CCBY3 },
    rotateY: 0, lengthM: 4.84,
    materials: { paint: ['bodywork'], glass: ['glass'], tire: ['rubber'] },
    wheelNodes: ['wheel_front_left', 'wheel_back_left', 'wheel_back_right', 'wheel_front_right'],
    partNodes: { spoiler: ['aileron'] },
    mods: { spoiler: false, frontLip: true },
    notes: 'Arka spoiler modelin kendi parçasıdır; düzenleyicide açılıp kapatılabilir.',
  },
];
