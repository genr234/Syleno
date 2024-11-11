import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
	View,
	StyleSheet,
	Platform,
	Dimensions,
	TouchableOpacity,
	Alert,
} from 'react-native';
import { H1, Paragraph, YStack, Button, Text, Spacer } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getOrientation = () => {
	const { width, height } = Dimensions.get('window');
	return width > height ? 'landscape' : 'portrait';
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
	iframe: {
		width: '100%',
		height: '100%',
		border: 'none',
	},
	orientationMessage: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.7)',
		padding: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	backButton: {
		position: 'absolute',
		top: 40,
		left: 10,
		backgroundColor: 'rgba(0,0,0,0.5)',
		borderRadius: 20,
		padding: 10,
		zIndex: 10,
	},
});

export default function CoolMathGame() {
	const params = useLocalSearchParams();
	const [orientation, setOrientation] = useState(getOrientation());
	const [id, setId] = useState();
	const router = useRouter();

	useEffect(() => {
		const updateOrientation = () => {
			setOrientation(getOrientation());
		};

		Dimensions.addEventListener('change', updateOrientation);
		fetchGameUrl();
	}, []);

	const handleBack = () => {
		router.navigate('/apps/games');
	};

	const rotateScreen = async () => {
		if (Platform.OS !== 'web') {
			try {
				if (orientation === 'portrait') {
					await ScreenOrientation.lockAsync(
						ScreenOrientation.OrientationLock.LANDSCAPE,
					);
				} else {
					await ScreenOrientation.lockAsync(
						ScreenOrientation.OrientationLock.PORTRAIT,
					);
				}
			} catch (error) {
				console.error('Failed to rotate screen:', error);
				alert(
					'Unable to rotate screen automatically. Please rotate your device manually.',
				);
			}
		} else {
			alert(
				'Screen rotation is not supported in web browsers. Please rotate your device manually.',
			);
		}
	};

	const fetchGameUrl = async () => {
		try {
			const storedUrls = await AsyncStorage.getItem('gameUrls');
			if (storedUrls === null) {
				throw new Error('No game sources found');
			}

			const gameUrls = JSON.parse(storedUrls);
			let gameData = null;

			for (const sourceUrl of gameUrls) {
				try {
					const response = await fetch(sourceUrl);
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.json();
					gameData = data.find((game) => game.id === parseInt(params.id));
					if (gameData) break;
				} catch (error) {
					console.error(`Error fetching from ${sourceUrl}:`, error);
				}
			}

			if (gameData) {
				setId(gameData.id);
			} else {
				throw new Error('Game not found in any source');
			}
		} catch (error) {
			console.error('Error fetching game URL:', error);
			Alert.alert('Error', 'Failed to load game data. Please try again later.');
			router.navigate('/apps/games');
		}
	};

	const renderContent = () => {
		if (orientation === 'portrait') {
			return (
				<YStack style={styles.orientationMessage} alignItems="center">
					<Spacer size="$6" />
					<H1 color="white">Please rotate your device</H1>
					<Spacer />
					<Paragraph color="white">
						This content is best viewed in landscape mode.
					</Paragraph>
					<Spacer />
					<Button onPress={rotateScreen}>Rotate Screen</Button>
				</YStack>
			);
		}

		if (Platform.OS === 'web') {
			return (
				<iframe
					src={`https://www.coolmathgames.com/sites/default/files/public_games/${id}/`}
					title="Game iframe"
					allowFullScreen
					style={styles.iframe}
				/>
			);
		}

		return (
			<WebView
				source={{
					uri: `https://www.coolmathgames.com/sites/default/files/public_games/${id}/`,
				}}
				style={styles.iframe}
				cacheMode="LOAD_CACHE_ELSE_NETWORK"
				cacheEnabled
				allowsFullscreenVideo
				javaScriptEnabled
				domStorageEnabled
			/>
		);
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.backButton} onPress={handleBack}>
				<ChevronLeft size={24} color="white" />
			</TouchableOpacity>
			{renderContent()}
		</View>
	);
}