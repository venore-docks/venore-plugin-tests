// Padrão do banner do relatório — portado verbatim de nestpro/public/assessments/disc-pattern.svg (só
// removidos o prólogo XML e o comentário do gerador). Embutido como string porque o plugin não tem
// pasta public/. Usado como background-image via data URI (isolado: um <svg> inline vazaria as
// classes .st0/.st1… pro resto da página e colidiria com o do hartchart-background.ts), repetindo
// como no original (`bg-center`, repeat padrão). Impressão do fundo é forçada com
// print-color-adjust:exact em report-print-style.tsx.
export const DISC_PATTERN_BACKGROUND_SVG = `<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 3000 300">
  
  <defs>
    <style>
      .st0 {
        fill: url(#Gradiente_sem_nome_5);
      }

      .st1 {
        fill: #46ab64;
      }

      .st2 {
        fill: url(#Gradiente_sem_nome_2);
      }

      .st3 {
        fill: #fff;
      }

      .st4 {
        fill: url(#Gradiente_sem_nome);
      }

      .st5 {
        fill: #f2f2f3;
      }

      .st6 {
        fill: url(#Gradiente_sem_nome_7);
      }

      .st7 {
        fill: #f4ac21;
      }

      .st8 {
        fill: url(#Gradiente_sem_nome_4);
      }

      .st9 {
        fill: url(#Gradiente_sem_nome_6);
      }

      .st10 {
        fill: #4f70b4;
      }

      .st11 {
        fill: url(#Gradiente_sem_nome_3);
      }

      .st12 {
        fill: url(#Gradiente_sem_nome_8);
      }

      .st13 {
        fill: #b63253;
      }

      .st14 {
        fill: #f7f7f7;
      }
    </style>
    <linearGradient id="Gradiente_sem_nome" data-name="Gradiente sem nome" x1="1332.3" y1="2656.8" x2="1379" y2="2656.8" gradientTransform="translate(4104.6 1598.9) rotate(-90) scale(1 -1)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".5" stop-color="#fcfcfc"/>
      <stop offset=".7" stop-color="#f5f5f5"/>
      <stop offset=".9" stop-color="#e8e8e8"/>
      <stop offset="1" stop-color="#e0e0e0"/>
    </linearGradient>
    <linearGradient id="Gradiente_sem_nome_2" data-name="Gradiente sem nome 2" x1="1519" y1="2795.9" x2="1565.7" y2="2795.9" gradientTransform="translate(4104.5 1598.9) rotate(-90) scale(1 -1)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".5" stop-color="#fcfcfc"/>
      <stop offset=".7" stop-color="#f5f5f5"/>
      <stop offset=".9" stop-color="#e8e8e8"/>
      <stop offset="1" stop-color="#e0e0e0"/>
    </linearGradient>
    <linearGradient id="Gradiente_sem_nome_3" data-name="Gradiente sem nome 3" x1="1332" y1="2749.3" x2="1378.8" y2="2749.3" gradientTransform="translate(4104.5 1598.9) rotate(-90) scale(1 -1)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".5" stop-color="#fcfcfc"/>
      <stop offset=".7" stop-color="#f5f5f5"/>
      <stop offset=".9" stop-color="#e8e8e8"/>
      <stop offset="1" stop-color="#e0e0e0"/>
    </linearGradient>
    <linearGradient id="Gradiente_sem_nome_4" data-name="Gradiente sem nome 4" x1="1470.4" y1="1120.8" x2="1513.3" y2="1120.8" gradientTransform="translate(4104.6 -1256.2) rotate(90)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".5" stop-color="#fcfcfc"/>
      <stop offset=".7" stop-color="#f5f5f5"/>
      <stop offset=".9" stop-color="#e8e8e8"/>
      <stop offset="1" stop-color="#e0e0e0"/>
    </linearGradient>
    <linearGradient id="Gradiente_sem_nome_5" data-name="Gradiente sem nome 5" x1="2055.2" y1="1336.9" x2="2098.1" y2="1336.9" gradientTransform="translate(-1315.5 -1840.9) rotate(90) scale(1 -1)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".5" stop-color="#fcfcfc"/>
      <stop offset=".7" stop-color="#f5f5f5"/>
      <stop offset=".9" stop-color="#e8e8e8"/>
      <stop offset="1" stop-color="#e0e0e0"/>
    </linearGradient>
    <linearGradient id="Gradiente_sem_nome_6" data-name="Gradiente sem nome 6" x1="1874.3" y1="-2232.8" x2="1921" y2="-2232.8" gradientTransform="translate(3914.4 -1840.9) rotate(90) scale(1 -1)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".5" stop-color="#fcfcfc"/>
      <stop offset=".7" stop-color="#f5f5f5"/>
      <stop offset=".9" stop-color="#e8e8e8"/>
      <stop offset="1" stop-color="#e0e0e0"/>
    </linearGradient>
    <linearGradient id="Gradiente_sem_nome_7" data-name="Gradiente sem nome 7" x1="2061" y1="-2093.7" x2="2107.8" y2="-2093.7" gradientTransform="translate(3914.4 -1840.8) rotate(90) scale(1 -1)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".5" stop-color="#fcfcfc"/>
      <stop offset=".7" stop-color="#f5f5f5"/>
      <stop offset=".9" stop-color="#e8e8e8"/>
      <stop offset="1" stop-color="#e0e0e0"/>
    </linearGradient>
    <linearGradient id="Gradiente_sem_nome_8" data-name="Gradiente sem nome 8" x1="1874.1" y1="-2140.1" x2="1920.8" y2="-2140.1" gradientTransform="translate(3914.4 -1840.8) rotate(90) scale(1 -1)" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".5" stop-color="#fcfcfc"/>
      <stop offset=".7" stop-color="#f5f5f5"/>
      <stop offset=".9" stop-color="#e8e8e8"/>
      <stop offset="1" stop-color="#e0e0e0"/>
    </linearGradient>
  </defs>
  <g>
    <rect class="st1" x="1424.4" y="266.6" width="46.8" height="46.8"/>
    <rect class="st4" x="1424.4" y="219.9" width="46.8" height="46.8"/>
    <rect class="st5" x="1377.6" y="126.6" width="46.8" height="46.8"/>
    <rect class="st1" x="1379.2" y="173.2" width="46.8" height="46.8"/>
    <rect class="st13" x="1424.3" y="173.2" width="46.8" height="46.8"/>
    <rect class="st10" x="1471.2" y="126.7" width="46.8" height="46.8"/>
    <rect class="st7" x="1424.2" y="79.8" width="46.8" height="46.8"/>
    <rect class="st5" x="1238.5" y="126.6" width="46.8" height="46.8"/>
    <rect class="st5" x="1145" y="266.6" width="46.8" height="46.8"/>
    <rect class="st7" x="1238.3" y="266.6" width="46.8" height="46.8"/>
    <rect class="st14" x="1285.1" y="126.5" width="46.8" height="46.8"/>
    <rect class="st5" x="1330.9" y="79.8" width="46.8" height="46.8"/>
    <rect class="st2" x="1285.2" y="33.3" width="46.8" height="46.8"/>
    <rect class="st11" x="1331.8" y="220.1" width="46.8" height="46.8"/>
    <rect class="st5" x="1285" y="173.2" width="46.8" height="46.8"/>
    <rect class="st7" x="1191.6" y="219.9" width="46.8" height="46.8"/>
    <rect class="st13" x="1238.5" y="173.2" width="46.8" height="46.8"/>
    <rect class="st10" x="1332.2" y="266.6" width="46.8" height="46.8"/>
    <rect class="st3" x="1331.6" y="126.6" width="46.8" height="46.8"/>
    <rect class="st14" x="1331" y="33.2" width="46.8" height="46.8"/>
    <rect class="st5" x="1517.7" y="33.2" width="46.8" height="46.8"/>
    <rect class="st5" x="1517.9" y="173.2" width="46.8" height="46.8"/>
    <rect class="st13" x="1517.6" y="266.6" width="46.8" height="46.8"/>
    <rect class="st7" x="1517.8" y="79.8" width="46.8" height="46.8"/>
  </g>
  <g>
    <rect class="st5" x="2919.3" y="128.5" width="42.9" height="42.9"/>
    <rect class="st5" x="2833.5" width="42.9" height="42.9"/>
    <rect class="st7" x="2919.1" width="42.9" height="42.9"/>
    <rect class="st14" x="2962.1" y="128.5" width="42.9" height="42.9"/>
    <rect class="st8" x="2962.3" y="214.2" width="42.9" height="42.9"/>
    <rect class="st5" x="2962.1" y="85.6" width="42.9" height="42.9"/>
    <rect class="st7" x="2876.4" y="42.9" width="42.9" height="42.9"/>
    <rect class="st13" x="2919.3" y="85.7" width="42.9" height="42.9"/>
  </g>
  <g>
    <rect class="st5" x="43.1" y="128.6" width="42.9" height="42.9"/>
    <rect class="st5" x="128.8" y="0" width="42.9" height="42.9"/>
    <rect class="st7" x="43.3" y=".1" width="42.9" height="42.9"/>
    <rect class="st14" x=".2" y="128.6" width="42.9" height="42.9"/>
    <rect class="st0" y="214.2" width="42.9" height="42.9"/>
    <rect class="st5" x=".3" y="85.7" width="42.9" height="42.9"/>
    <rect class="st7" x="85.9" y="43" width="42.9" height="42.9"/>
    <rect class="st13" x="43" y="85.8" width="42.9" height="42.9"/>
  </g>
  <g>
    <rect class="st1" x="1658.2" y="-13.4" width="46.8" height="46.8"/>
    <rect class="st9" x="1658.2" y="33.4" width="46.8" height="46.8"/>
    <rect class="st5" x="1705.1" y="126.7" width="46.8" height="46.8"/>
    <rect class="st1" x="1703.5" y="80" width="46.8" height="46.8"/>
    <rect class="st13" x="1658.2" y="80" width="46.8" height="46.8"/>
    <rect class="st10" x="1611.4" y="126.7" width="46.8" height="46.8"/>
    <rect class="st7" x="1658.3" y="173.4" width="46.8" height="46.8"/>
    <rect class="st5" x="1844.2" y="126.7" width="46.8" height="46.8"/>
    <rect class="st5" x="1937.7" y="-13.4" width="46.8" height="46.8"/>
    <rect class="st7" x="1844.5" y="-13.4" width="46.8" height="46.8"/>
    <rect class="st14" x="1797.5" y="126.7" width="46.8" height="46.8"/>
    <rect class="st5" x="1751.5" y="173.4" width="46.8" height="46.8"/>
    <rect class="st6" x="1797.3" y="220.1" width="46.8" height="46.8"/>
    <rect class="st12" x="1750.9" y="33.3" width="46.8" height="46.8"/>
    <rect class="st5" x="1797.6" y="80" width="46.8" height="46.8"/>
    <rect class="st7" x="1890.9" y="33.4" width="46.8" height="46.8"/>
    <rect class="st13" x="1844.2" y="80" width="46.8" height="46.8"/>
    <rect class="st10" x="1750.4" y="-13.5" width="46.8" height="46.8"/>
    <rect class="st3" x="1751.1" y="126.7" width="46.8" height="46.8"/>
    <rect class="st14" x="1751.5" y="220.1" width="46.8" height="46.8"/>
    <rect class="st5" x="1564.8" y="220" width="46.8" height="46.8"/>
    <rect class="st5" x="1564.7" y="80" width="46.8" height="46.8"/>
    <rect class="st13" x="1565" y="-13.4" width="46.8" height="46.8"/>
    <rect class="st7" x="1564.6" y="173.4" width="46.8" height="46.8"/>
  </g>
</svg>`;

export const DISC_PATTERN_BACKGROUND_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(DISC_PATTERN_BACKGROUND_SVG)}")`;
