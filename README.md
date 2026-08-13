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
`npx expo start --dev-client` then press `a`

`ip a` -- to get pc ip address

# To reserve space for the absolute tab bar in tab content.

Add this to feed:

```js
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const tabBarHeight = useBottomTabBarHeight();
```

Then update FlatList:

```js
contentContainerStyle={{
  paddingBottom: tabBarHeight + 16, // ✅ THIS FIXES OVERLAP
  flexGrow: 1,
  justifyContent: posts.length === 0 ? "center" : "flex-start",
}}
```

## Firebase

https://console.firebase.google.com/

<!--
splash screen
Size: 1242 x 2436
Format: PNG
Background: solid (no transparency)

icon
Size: 1024 x 1024
Format: PNG
NO transparency (important for Android)
Keep padding (don’t let content touch edges)

Adaptive icon (Android)
Transparent background
Logo centered
Plenty of padding

"adaptiveIcon": {
  "backgroundColor": "#E6F4FE",
  "foregroundImage": "./assets/images/android-icon-foreground.png",
  "backgroundImage": "./assets/images/android-icon-background.png",
  "monochromeImage": "./assets/images/android-icon-monochrome.png"
},
-->

<!--
react-native-toast-message
# MAKE SURE TO USE THE SAME CONSISTENT SKY BLUE

1. delete user account
2. logout user
3. create error screen ✅
4. create loading screen ✅
5. create splash screen


# AI generated screens to do:
1. download those icons gotten from online and use them in the expo image ✅
2. in the forgot password screen check the back arrow to make sure you use the correct icon -- the fix is in rest password use ionicons ✅
3. make sure the forgot password envelop image shown on success and the text is styled correctly.
4. make sure all expo images are linked correctly
5. cross check the open eye close eye implementation in login, register and other forms. ✅
6. check the forgot password back button to make sure the style is ok ✅
7. check the reset password wave and password eyes ✅
8. check the verify email back button to make sure the style is ok.
9. check the apostrophe sign in login page.
10. Add ad injection every 4 posts (you already planned this) -- in for-you feed

Brand blue: #2563eb
Google svg --- https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg
Apple svg --- https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg
Facebook svg --- https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg

Envelop icon --- https://img.icons8.com/ios-filled/50/9ca3af/new-post.png
Padlock icon --- https://img.icons8.com/ios-filled/50/9ca3af/lock-2.png
Open-eye icon --- https://img.icons8.com/ios-filled/50/9ca3af/visible.png
placeholder image --- https://www.gravatar.com/avatar/?d=mp&s=200

the code above is my LoadingScreen.tsx code, update the code by implementing the ui of the image i uploaded. return a production ready LoadingScreen.tsx code. do not omit or miss anything.

use zustand only if necessary
// router.push(`/post/${item.slug}`)
router.push({
   pathname: "/post/[slug]",
   params: { slug: item.slug },
})

1. use expo image
2. use pressable
3. use react query
4. implement optimistic updates for the like and unlike
5. implement optimistic updates for the bookmarks and unbookmarks
6. use typescript
7. use SafeAreaView add edges={["top"]}
8. use the improvements already applied in the useCategories.ts hook and the onboarding.tsx code
9. when the comment icon is clicked it should open the post --- that is it should link to the single post.
10. the user profile image should link to /preferences/profile
11. implement infinite scroll to match the backend implementation
12. make sure to handle when data is empty --- when there is no posts properly
13. make sure to handle when there is error and retry properly
14. You have built a similar UI above --- the ForYouFeed index.tsx code use the improvements already applied.
15. Blur card background (expo-blur)
16. Better icons (lucide-react-native)
17. Time formatter ("2h ago") use date-fns
18. the category tabs shouls scroll horizontally if they can not all be displayed in the screen at once.
19. when a category is clicked the post for that category should be displayed. But when the app first loads 19. the post for the "General" category should be displayed.
20. handle loading state
21. use normal react native styles --- do not use tailwind css.
22. handle empty state

ForYouFeed index.tsx code
onboarding.tsx
useCategories.ts

NOTE ALL THESE CREDENTIAL INCLUDE IN THE CUSTOM HOOKS, NEED TO BE SOLVED THE BETTER AUTH WAY
NOTE THAT SHARE APP FEATURE THAT REQUIRES A ROUTE TO BE CALLED FOR ATTRIBUTION. ✅
NOTE UPDATE ROUTES IN ALL FETCH HOOKS
NOTE ALLOW USERS TO UPLOAD PROFILE IMAGE
NOTE IMPLEMENT THE LOADING PAGE LIKE THE ERROR PAGE AND USE IT.
NOTE UPLOAD A FALLBACK IMAGE FOR THE USER PROFILE IN FEED AND OTHER SCREENS
NOTE CREATE THE PLACEHOLDER IMAGE FOR THE [SLUG].TSX SCREEN
NOTE IN THE [SLUG].TSX SCREEN UPDATE THE CREDENTIAL INCLUDE IN THE SHAREAPP FUNCTION TO BETTER AUTH METHOD
NOTE IMPLEMENT PUSH NOTIFICATION
NOTE ADD SHARE POST FEATURE TO [SLUG].TSX
NOTE SEE IF YOU CAN ADD USEMEMO TO SCREENS THAT DO NOT HAVE IT
NOTE UPDATE THE CONFIG/IMAGEKIT BACKEND URL
 -->

<!-- 1. use expo image
2. use pressable
3. use react query
4. implement optimistic updates for the like comment and unlike comment
5. use typescript
6. use SafeAreaView add edges={["top"]}
7. implement infinite scroll to match the backend implementation
8. use the improvements already applied in the useCategories.ts hook and the onboarding.tsx code
9. make sure to handle when there is error and retry properly
10. Blur card background (expo-blur)
11. Better icons (lucide-react-native)
12. Time formatter ("2h ago") use date-fns
13. handle loading state
14. use normal react native styles --- do not use tailwind css.
15. note the issues raised by code rabbit in the UI you have built above and apply the improvements to avoid those issues.
16. fetch comments using the id received as params i passed from the post detail components using:

```js
router.push({
  pathname: "/comments/comment-feed",
  params: { postId: data.id },
});
```

17. Handle empty comment --- when there is no comment
18. handle create comment to match the backend implementation
19. handle update comment to match the backend implementation
20. handle delete comment to match the backend implementation
21. handle comment reply properly, to match the backend implementation -->

<!--
Notification improvements
🚀 Optional next step (highly recommended)

If you want this to be bulletproof, next improvements:

Store registered key in AsyncStorage (persist across app restarts)
Add backend endpoint to delete token on logout
Handle multiple devices per user
 -->

<!-- 1. use expo image
2. use Pressable
3. use typescript
4. use SafeAreaView add edges={["top"]}
5. Blur card background (expo-blur)
6. Better icons (lucide-react-native)
7. handle loading state
8. use normal react native styles --- do not use tailwind css.
9. note the issues raised by code rabbit in the UI you have built above and apply the improvements to avoid those issues.
10. handle error and retry
11. use imageKit for the image --- my imagekit sdk is already initialized and it is at lib/imageKit.ts
12. when the profile image is clicked, the user should be allowed to choose an image for the profile image from their phone. And this should update the current user image in better auth. the better auth function to call is authClient.updateUser
13. the Share Eaglespress should just be a Pressable the does nothing, i will implement this myself
14. the bookmarks should link to /(tabs)/bookmarks
15. the rate us should open the store review page
16. the privacy policy should link to http://eaglespress.com/privacy-policy
17. the terms & condition should link to http://eaglespress.com/terms-and-condition
18. the delete account should the user account from better auth by calling the better auth function authClient.deleteUser

return a complete production ready profile.tsx code. do not omit or miss anything.

below is the better auth documentation for your reference:
https://better-auth.com/docs/concepts/users-accounts#delete-user
below is the imagekit documentation for your reference:
https://imagekit.io/docs/integration/react-native#setting-up-imagekit-javascript-sdk

 "typescript": "^5.9.3"
-->
