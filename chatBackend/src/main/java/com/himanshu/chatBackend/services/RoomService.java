package com.himanshu.chatBackend.services;

import com.himanshu.chatBackend.entities.Message;
import com.himanshu.chatBackend.entities.Room;
//import com.himanshu.chatBackend.repositories.RoomRepositories;
import com.himanshu.chatBackend.repositories.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
//@RequiredArgsConstructor
public class RoomService {
    private RoomRepository roomRepository;
    RoomService(RoomRepository roomRepository){
        this.roomRepository = roomRepository;
    }
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

    public Room joinRoom(String roomID){
        Room room = roomRepository.findByRoomID(roomID);
        if(room == null){
            throw new RuntimeException("Room not Found");
        }
        return room;
    }

//    public Room getMessages(String roomID){
//        Room room = roomRepository.findByRoomID(roomID);
//        if(room==null){
//            throw new RuntimeException("Something went wrong");
//        }
//        return room;
//    }
public List<Message> getMessages(
        String roomId,
        int page,
        int size) {

    // Validate pagination
    if (page < 0 || size <= 0) {
        throw new IllegalArgumentException(
                "Invalid page or size"
        );
    }
    // Find room
    Room room = roomRepository.findByRoomID(roomId);
    if (room == null) {
        throw new RuntimeException("Room not found");
    }
    // Get all messages
    List<Message> messages = room.getMessages();
    // Pagination - latest messages first
    int start = Math.max(
            0,
            messages.size() - (page + 1) * size
    );
    int end = Math.min(
            messages.size(),
            start + size
    );
    return messages.subList(start, end);
    }

}
