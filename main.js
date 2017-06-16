const electron = require('electron')
const {app, Tray, Menu, BrowserWindow} = require('electron')
const notifier = require('node-notifier')
const AutoLaunch = require('auto-launch')
const Store = require('electron-store')
const path = require('path')

const appAutoLauncher = new AutoLaunch({
    name: 'Blinker',
    isHidden: true,
    mac: {
        useLaunchAgent: true
    }
})
const store = new Store({
    defaults: {
        config: {
            launchOnStartup: true,
            playSound: true
        }
    }
})

const config = store.get('config')

const TIMER_LABEL_STOPPED = 'Start the timer'
const TIMER_LABEL_STARTED = 'Stop the timer'

// Our global objects
let mainWindow
let aboutWindow
let timerStarted
let launchOnStartup = config.launchOnStartup || true
let playSound = config.playSound || true
let timer
const maxExpositionTime = 20 * 60 * 1000
const breakTime = 20 * 1000

let tray = null
let contextMenu = null

const launchApplication = () => {
    // Setup the menubar with an icon
    tray = new Tray(path.join(__dirname, 'icons/tray.png'))

    contextMenu = Menu.buildFromTemplate([
        {
            label: TIMER_LABEL_STARTED,
            type: 'checkbox',
            sublabel: 'Click to toggle timer',
            click () {
                toggleTimer()
            }
        },
        {type: 'separator'},
        {
            type: 'checkbox',
            label: 'Launch the application on system startup',
            sublabel: 'If this option is enabled, application will start on system startup',
            checked: launchOnStartup,
            click () {
                toggleStartup()
            }
        },
        {type: 'separator'},
        {
            type: 'checkbox',
            label: 'Play sounds with notifications',
            sublabel: 'If this option is enabled, a sound will be played on every notification',
            checked: playSound,
            click () {
                toggleSound()
            }
        },
        {type: 'separator'},
        {
            type: 'normal',
            label: 'About Blinker',
            click () {
                toggleAboutWindow()
            }
        },
        {type: 'separator'},
        {
            role: 'quit',
            label: 'Quit application'
        }
    ])

    tray.setToolTip('Click to set application settings.')

    tray.setContextMenu(contextMenu)

    // Start our timer
    startTimer()

    // Enable launch on startup by default
    appAutoLauncher.isEnabled()
        .then(function (isEnabled) {
            if (isEnabled) {
                return
            }
            appAutoLauncher.enable()
                .then(function () {
                    store.set('config.launchOnStartup', true)
                })
        })
        .catch(function (err) {
        })

    // Set the about window
    aboutWindow = new BrowserWindow({
        width: 400,
        height: 350,
        show: false,
        frame: false,
        resizable: false
    })
    aboutWindow.loadURL(`file://${path.join(__dirname, 'about.html')}`)
    aboutWindow.on('blur', () => {
        aboutWindow.hide()
    })

}

const toggleStartup = () => {
    if (launchOnStartup) {
        appAutoLauncher.enable()
            .then(function () {
                store.set('config.launchOnStartup', true)
                notifyLaunchChanged()
            })
            .catch(function (err) {
            })
    }
    else {
        appAutoLauncher.disable()
            .then(function () {
                store.set('config.launchOnStartup', false)
                notifyLaunchChanged()
            })
            .catch(function (err) {
            })
    }
}

const notifyLaunchChanged = () => {
    notifier.notify({
        title: 'Startup status changed',
        message: launchOnStartup ? 'You will have to launch the application every time you log in' : 'Great! Application will launch on system startup',
        icon: path.join(__dirname, 'icons/eye.png'),
        contentImage: '',
        sound: playSound
    })
    launchOnStartup = !launchOnStartup
    contextMenu.items[2].checked = launchOnStartup
    tray.setContextMenu(contextMenu)
}

const toggleTimer = () => {
    if (timerStarted) {
        stopTimer()
        contextMenu.items[1].label = TIMER_LABEL_STOPPED
    }
    else {
        startTimer()
        contextMenu.items[1].label = TIMER_LABEL_STARTED
    }
    tray.setContextMenu(contextMenu)
}

const toggleSound = () => {
    playSound = !playSound
    store.set('config.playSound', playSound)
}

const startTimer = () => {
    timerStarted = true
    timer = setTimeout(function () {
        takeABreak()
    }, maxExpositionTime)
}

const stopTimer = () => {
    timerStarted = false
    clearTimeout(timer)
}

const takeABreak = () => {
    stopTimer()

    notifier.notify({
        title: 'Take a break from the screen!',
        message: 'Your eyes need to rest buddy.',
        icon: path.join(__dirname, 'icons/eye.png'),
        contentImage: '',
        sound: playSound
    })

    setTimeout(function () {
        notifier.notify({
            title: 'Go back to work !',
            message: 'Yay !',
            icon: path.join(__dirname, 'icons/eye.png'),
            contentImage: '',
            sound: playSound
        })
        startTimer()
    }, breakTime)
}

const toggleAboutWindow = () => {
    if (aboutWindow.isVisible()) {
        aboutWindow.hide()
    } else {
        aboutWindow.show()
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', launchApplication)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createTray()
    }
})
