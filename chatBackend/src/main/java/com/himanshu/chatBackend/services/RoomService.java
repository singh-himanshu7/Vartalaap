package com.himanshu.chatBackend.services;

import com.himanshu.chatBackend.entities.Room;
//import com.himanshu.chatBackend.repositories.RoomRepositories;
import com.himanshu.chatBackend.repositories.RoomRepository;

public class RoomService {
    private RoomRepository roomRepository;
    public Room createRoom(String roomId) {

        // Check if room already exists
        if (roomRepository.findByRoomID(roomId) != null) {
            throw new RuntimeException("Room Already Exists");
        }
        // Create new room
        Room room = new Room();
        room.setRoomID(roomId);

        // Save room
        return roomRepository.save(room);
    }
}
