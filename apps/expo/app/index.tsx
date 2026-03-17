import { Stack, useRouter } from 'expo-router'

export default function Screen() {
  const router = useRouter()

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Home',
        }}
      />
    </>
  )
}
