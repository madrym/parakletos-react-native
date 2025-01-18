import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import React from 'react';

const Home = () => {
  return (
    <View>
      <Link href="/note/1">
        <Text>Go to Note 1</Text>
      </Link>
    </View>
  );
};

export default Home;
