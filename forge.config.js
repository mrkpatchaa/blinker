module.exports = {
  buildIdentifier: "com.mrkpatchaa.blinker",
  packagerConfig: {
    icon: "./icons/eye.png",
  },
  rebuildConfig: {},
  makers: [
    {
      // Path to the icon to use for the app in the DMG window
      name: "@electron-forge/maker-dmg",
      config: {
        icon: "./icons/eye.icns",
        overwrite: true,
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          maintainer: "Médédé Raymond KPATCHAA",
          homepage: "https://mrkpatchaa.com",
          icon: "./icons/eye.png",
        },
      },
    },
    {
      name: "@electron-forge/maker-wix",
      config: {
        icon: "./icons/eye.ico",
        manufacturer: "Médédé Raymond KPATCHAA",
      },
    },
  ],
};
