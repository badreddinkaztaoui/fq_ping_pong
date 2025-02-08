export const matches = [
    {
        player1: { name: 'XERXES', avatar: '/images/users/player-2.png' },
        player2: { name: 'PLAYER 2', avatar: '/images/users/player-2.png' },
        score: '10 : 2',
        date: '2024-01-20'
    },
    {
        player1: { name: 'XERXES', avatar: '/images/users/player-2.png' },
        player2: { name: 'PLAYER 3', avatar: '/images/users/player-2.png' },
        score: '8 : 5',
        date: '2024-01-19'
    },
    {
        player1: { name: 'PLAYER 4', avatar: '/images/users/player-2.png' },
        player2: { name: 'XERXES', avatar: '/images/users/player-2.png' },
        score: '3 : 10',
        date: '2024-01-18'
    },
    {
        player1: { name: 'XERXES', avatar: '/images/users/player-2.png' },
        player2: { name: 'PLAYER 5', avatar: '/images/users/player-2.png' },
        score: '10 : 7',
        date: '2024-01-17'
    },
    {
        player1: { name: 'PLAYER 6', avatar: '/images/users/player-2.png' },
        player2: { name: 'XERXES', avatar: '/images/users/player-2.png' },
        score: '6 : 10',
        date: '2024-01-16'
    }
];


export const users = [
    {
        id: 1,
        name: 'Jett',
        rank: 'Radiant',
        avatar: '/images/users/player-1.jpeg',
        status: 'online',
        lastMessage: 'Watch this!',
        unreadCount: 2,
        isBlocked: false,
        messages: [
            {
                id: 1,
                text: "Going A, cover me",
                timestamp: "14:32",
                sender: "Jett"
            },
            {
                id: 2,
                text: "Nice shot!",
                timestamp: "14:33",
                sender: "me"
            }
        ]
    },
    {
        id: 2,
        name: 'Sage',
        rank: 'Immortal 3',
        avatar: '/images/users/player-1.jpeg',
        status: 'away',
        lastMessage: 'Need healing?',
        unreadCount: 0,
        isBlocked: false,
        messages: [
            {
                id: 1,
                text: "Healing up",
                timestamp: "13:45",
                sender: "Sage"
            }
        ]
    },
    {
        id: 3,
        name: 'Phoenix',
        rank: 'Immortal 1',
        avatar: '/images/users/player-1.jpeg',
        status: 'online',
        lastMessage: 'Got your back!',
        unreadCount: 1,
        isBlocked: false,
        messages: []
    },
    {
        id: 4,
        name: 'Viper',
        rank: 'Diamond 2',
        avatar: '/images/users/player-1.jpeg',
        status: 'offline',
        lastMessage: 'Screen going up',
        unreadCount: 0,
        isBlocked: true,
        messages: []
    },
    {
        id: 5,
        name: 'Cypher',
        rank: 'Ascendant 2',
        avatar: '/images/users/player-1.jpeg',
        status: 'online',
        lastMessage: 'Enemy spotted',
        unreadCount: 3,
        isBlocked: false,
        messages: []
    }
];

export const emojiList = ['😀', '😎', '👍', '❤️', '🎮', '🔥', '⚔️', '🛡️', '💣', '🎯'];

export const quickResponses = [
    'Nice Game!',
    'Another Match?',
    'Enemy spotted',
    'Well played'
];

export const ranksData = {
    'Iron': '#707070',
    'Bronze': '#9F6147',
    'Silver': '#BEBEBE',
    'Gold': '#FFD700',
    'Platinum': '#4FC1E9',
    'Diamond': '#B967FF',
    'Ascendant': '#00FFB3',
    'Immortal': '#FF1744',
    'Radiant': '#FFF'
};


export const matchData = [
    {
        id: '#12345',
        player1: 'Ali',
        player1Rank: 'Radiant',
        score1: 15,
        image1: '../../../public/images/accounts-image/player-0.webp',
        player2: 'Zoe',
        player2Rank: 'Immortal',
        score2: 12,
        image2: '../../../public/images/accounts-image/player-1.jpeg',
    },
    {
        id: '#67890',
        player1: 'Max',
        player1Rank: 'Immortal',
        score1: 8,
        image1: '../../../public/images/accounts-image/player-0.webp',
        player2: 'Eli',
        player2Rank: 'Radiant',
        score2: 10,
        image2: '../../../public/images/accounts-image/player-1.jpeg',
    },
    {
        id: '#24680',
        player1: 'Leo',
        player1Rank: 'Radiant',
        score1: 13,
        image1: '../../../public/images/accounts-image/player-0.webp',
        player2: 'Ivy',
        player2Rank: 'Immortal',
        score2: 11,
        image2: '../../../public/images/accounts-image/player-1.jpeg',
    },
    {
        id: '#13579',
        player1: 'Nia',
        player1Rank: 'Immortal',
        score1: 9,
        image1: '../../../public/images/accounts-image/player-0.webp',
        player2: 'Kai',
        player2Rank: 'Radiant',
        score2: 14,
        image2: '../../../public/images/accounts-image/player-1.jpeg',
    },
    {
        id: '#11223',
        player1: 'Jay',
        player1Rank: 'Radiant',
        score1: 10,
        image1: '../../../public/images/accounts-image/player-0.webp',
        player2: 'Eve',
        player2Rank: 'Immortal',
        score2: 9,
        image2: '../../../public/images/accounts-image/player-1.jpeg',
    },
    {
        id: '#44556',
        player1: 'Ash',
        player1Rank: 'Immortal',
        score1: 12,
        image1: '../../../public/images/accounts-image/player-0.webp',
        player2: 'Lia',
        player2Rank: 'Radiant',
        score2: 13,
        image2: '../../../public/images/accounts-image/player-1.jpeg',
    },
    {
        id: '#77889',
        player1: 'Mia',
        player1Rank: 'Radiant',
        score1: 11,
        image1: '../../../public/images/accounts-image/player-0.webp',
        player2: 'Sam',
        player2Rank: 'Immortal',
        score2: 10,
        image2: '../../../public/images/accounts-image/player-1.jpeg',
    },
];