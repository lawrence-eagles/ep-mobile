# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

<!--
npx expo prebuild
npx expo run:android   # only first time, you still need to build from time to time
npx expo start # latter

nano android/gradle.properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m

npx expo start -c

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
1. download those icons gotten from online and use them in the expo image
2. in the forgot password screen check the back arrow to make sure you use the correct icon -- the fix is in rest password use ionicons
3. make sure the forgot password envelop image shown on success and the text is styled correctly.
4. make sure all expo images are linked correctly
5. cross check the open eye close eye implementation in login, register and other forms.
6. check the forgot password back button to make sure the style is ok
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

the code above is my login.tsx code, i get this issue from code rabbit: The screens use fixed-height content inside non-scrollable root containers, making controls unreachable on smaller devices or when the keyboard is open. allow the login form and footer to scroll above the keyboard. fix this issue and return a complete login.tsx code. do not omit or miss anything. Note make the scroll bar invisible.
 -->
