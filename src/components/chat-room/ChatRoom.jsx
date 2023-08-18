import React, { useEffect, useRef, useState } from 'react'
import { over } from 'stompjs';
import SockJS from 'sockjs-client';

const ChatRoom = () => {
    var stompClient = useRef(null);
    // const [client, setClient] = useState(null);
    const [privateChats, setPrivateChats] = useState(new Map());
    const [publicChats, setPublicChats] = useState([]);
    const [tab, setTab] = useState("CHATROOM");
    const [userData, setUserData] = useState({
        username: '',
        receivername: '',
        connected: false,
        message: '',
        password: ''
    });
    const autoScrollTopPublic = useRef();
    const autoScrollTopPrivate = useRef();
    // useEffect(() => {
    //     console.log(userData);
    // }, [userData]);

    const connect = () => {
        let Sock = new SockJS('http://192.168.2.8:8080/ws');
        stompClient.current = over(Sock);
        stompClient.current.connect({}, onConnected, onError);
    }

    const onConnected = () => {
        setUserData({ ...userData, "connected": true });
        stompClient.current.subscribe('/chatroom/public', onMessageReceived);
        stompClient.current.subscribe('/user/' + userData.username + '/private', onPrivateMessage);
        stompClient.current.send("/app/chat.addUser",
            {},
            JSON.stringify({ senderName: userData.username, type: 'JOIN' })
        )
        userJoin();
    }

    const userJoin = () => {
        var chatMessage = {
            senderName: userData.username,
            status: "JOIN",
            message: `${userData.username} has joined the room`
        };
        stompClient.current.send("/app/message", {}, JSON.stringify(chatMessage));
    }

    const onMessageReceived = (payload) => {
        var payloadData = JSON.parse(payload.body);
        switch (payloadData.status) {
            case "JOIN":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                if (!privateChats.get(payloadData.senderName)) {
                    privateChats.set(payloadData.senderName, []);
                    setPrivateChats(new Map(privateChats));
                }
                if (payloadData.senderName !== userData.username) {
                    var chatMessage = {
                        status: "NOTIFICATION",
                        receiverName: payloadData.senderName,
                        senderName: userData.username
                    };
                    stompClient.current.send("/app/private-message", {}, JSON.stringify(chatMessage));
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
            case "LEAVE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                privateChats.delete(payloadData.senderName);
                setPrivateChats(new Map(privateChats));
                break;
        }
    }

    const onPrivateMessage = (payload) => {
        console.log(payload);
        var payloadData = JSON.parse(payload.body);
        if (privateChats.get(payloadData.senderName)) {
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        } else {
            if (!payloadData.status === "NOTIFICATION") {
                let list = [];
                list.push(payloadData);
                privateChats.set(payloadData.senderName, list);
                setPrivateChats(new Map(privateChats));
            } else {
                if (payloadData.senderName !== userData.username) {
                    let list = [];
                    privateChats.set(payloadData.senderName, list);
                    setPrivateChats(new Map(privateChats));
                }
            }
        }
    }

    const onError = (err) => {
        console.log(err);

    }

    const handleMessage = (event) => {
        const { value } = event.target;
        setUserData({ ...userData, "message": value });
    }
    const sendValue = () => {
        if (stompClient.current) {
            var chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status: "MESSAGE"
            };
            console.log(chatMessage);
            stompClient.current.send("/app/message", {}, JSON.stringify(chatMessage));
            setUserData({ ...userData, "message": "" });
        }
    }

    const sendPrivateValue = () => {
        if (stompClient.current) {
            var chatMessage = {
                senderName: userData.username,
                receiverName: tab,
                message: userData.message,
                status: "MESSAGE"
            };

            if (userData.username !== tab) {
                privateChats.get(tab).push(chatMessage);
                setPrivateChats(new Map(privateChats));
            }
            stompClient.current.send("/app/private-message", {}, JSON.stringify(chatMessage));
            setUserData({ ...userData, "message": "" });
        }
    }

    const handleUsername = (event) => {
        const { value } = event.target;
        setUserData({ ...userData, "username": value });
    }

    const handlePassword = (event) => {
        const { value } = event.target;
        setUserData({ ...userData, "password": value });
    }

    const registerUser = () => {
        connect();
    }

    // const sendDisconnectMessage = async () => {
    //     var chatMessage = {
    //         senderName: userData.username,
    //         status: "LEAVE",
    //         message: `${userData.username} has left the room`
    //     };
    //     await client.send("/app/message", {}, JSON.stringify(chatMessage));
    // }

    // useEffect(() => {
    //     return async () => {
    //         console.log("start end ses 1")
    //         console.log(JSON.stringify(stompClient.current))
    //         if (stompClient.current) {
    //             console.log("start end ses 2")
    //             if (stompClient.current.connected) {
    //                 console.log("start end ses 3")
    //                 // await sendDisconnectMessage();
    //                 stompClient.current.disconnect();
    //             }
    //         }
    //     }
    // }, [])

    useEffect(() => {
        if (autoScrollTopPublic.current) {
            autoScrollTopPublic.current.scrollTop = autoScrollTopPublic.current.scrollHeight;
        }
        if (autoScrollTopPrivate.current) {
            autoScrollTopPrivate.current.scrollTop = autoScrollTopPrivate.current.scrollHeight;
        }
    }, [publicChats, privateChats, tab])

    return (
        <div className="container">
            {userData.connected ?
                <div>
                    <h1 style={{ width: "100%", textAlign: "center" }}>{userData.username}</h1>
                    <div className="chat-box">
                        <div className="member-list">
                            <ul>
                                <li onClick={() => { setTab("CHATROOM") }} className={`member ${tab === "CHATROOM" && "active"}`}>Chatroom</li>
                                {[...privateChats.keys()].filter((name) => name !== userData.username).map((name, index) => (
                                    <li onClick={() => { setTab(name) }} className={`member ${tab === name && "active"}`} key={index}>{name}</li>
                                ))}
                            </ul>
                        </div>
                        {tab === "CHATROOM" && <div className="chat-content">
                            <ul className="chat-messages" ref={autoScrollTopPublic}>
                                {publicChats.map((chat, index) => (
                                    <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                        {chat.senderName !== userData.username && <div className={`avatar ${chat.status === "JOIN" ? "join" : chat.status === "LEAVE" ? "left" : ""}`}>{chat.senderName}</div>}
                                        <div className="message-data">{chat.message}</div>
                                        {chat.senderName === userData.username && <div className={`avatar ${chat.status === "JOIN" ? "join" : chat.status === "LEAVE" ? "left" : "self"}`}>{chat.senderName}</div>}
                                    </li>
                                ))}
                            </ul>

                            <div className="send-message">
                                <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} />
                                <button type="button" className="send-button" onClick={sendValue}>send</button>
                            </div>
                        </div>}
                        {tab !== "CHATROOM" && <div className="chat-content">
                            <ul className="chat-messages" ref={autoScrollTopPrivate}>
                                {[...privateChats.get(tab)].map((chat, index) => (
                                    <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                        {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                        <div className="message-data">{chat.message}</div>
                                        {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                                    </li>
                                ))}
                            </ul>

                            <div className="send-message">
                                <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} />
                                <button type="button" className="send-button" onClick={sendPrivateValue}>send</button>
                            </div>
                        </div>}
                    </div>
                </div>
                :
                <div className="register">
                    <h1 style={{ textAlign: "center" }}>Chat App By Phat</h1>
                    <input
                        id="user-name"
                        placeholder="Enter your username"
                        name="userName"
                        value={userData.username}
                        onChange={handleUsername}
                        margin="normal"
                    />
                    <input
                        id="password"
                        placeholder="Enter your password"
                        name="password"
                        value={userData.password}
                        onChange={handlePassword}
                        margin="normal"
                    />
                    <button type="button" onClick={registerUser}>
                        connect
                    </button>
                </div>}
        </div>
    )
}

export default ChatRoom