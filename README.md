# bash commands

```bash
npx expo prebuild
npx expo run:android   # only first time, you still need to build from time to time
npx expo start --dev-client # latter then press a

nano android/gradle.properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m

npx expo start -c
```

# Android phone setup

1. Open Settings
   Scroll to Developer options
   Turn ON:
   ✅ USB Debugging

2. Connect your phone to your computer
3. On your phone:

Swipe down notification panel
Tap:
“Charging this device via USB”
Change it to:
✅ File Transfer (MTP) 4. run
`adb devices`

expected out put:

```bash
List of devices attached
R58M123ABC device
```

If you see unauthorized
Look at your phone screen
Tap Allow

then run again
`adb devices`

then run
`npx expo run:android`

follow up run
`npx expo start --dev-client` then press a

`ip a` -- to get pc ip address

<!--
# MAKE SURE TO USE THE SAME CONSISTENT SKY BLUE

1. delete user account
2. logout user
3. create error screen
4. create loading screen
5. create splash screen


the code above is my authentication index.ts code, update the code by implementing the ui of the image i uploaded. return a production ready authentication index.ts code. do not omit or miss anything.

note when the continue with email button is clicked the user should be redirected to the login page.
use zod for validation, use expo image, and use Pressable for buttons.



in the image i uploaded upscale the hero-image illustration, make it a transparent background.

# AI generated screens to do:
1. download those icons gotten from online and use them in the expo image ✅
2. in the forgot password screen check the back arrow to make sure you use the correct icon -- the fix is in rest password use ionicons ✅
3. make sure the forgot password envelop image shown on success and the text is styled correctly.
4. make sure all expo images are linked correctly
5. cross check the open eye close eye implementation in login, register and other forms. ✅
6. check the forgot password back button to make sure the style is ok ✅
7. check the reset password wave and password eyes
8. check the verify email back button to make sure the style is ok.
9. check the apostrophe sign in login page.

Brand blue: #2563eb
Google svg --- https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg
Apple svg --- https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg
Facebook svg --- https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg

Envelop icon --- https://img.icons8.com/ios-filled/50/9ca3af/new-post.png
Padlock icon --- https://img.icons8.com/ios-filled/50/9ca3af/lock-2.png
Open-eye icon --- https://img.icons8.com/ios-filled/50/9ca3af/visible.png

the code above is my LoadingScreen.tsx code, update the code by implementing the ui of the image i uploaded. return a production ready LoadingScreen.tsx code. do not omit or miss anything.

optimistic updates
use react query
us zustand only if necessary
call backend controllers.
use typescript

 -->
