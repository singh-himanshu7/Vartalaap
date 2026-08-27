package com.himanshu.chatBackend.controller;

import com.himanshu.chatBackend.entities.Room;
import com.himanshu.chatBackend.repositories.RoomRepository;
import com.himanshu.chatBackend.services.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/room")
public class RoomController {
    private RoomService roomService;
    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }
    //create room
    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody String roomId){
        try {
            Room room = roomService.createRoom(roomId);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(room);

        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }
    //get room
    
    //get message of the room

    //delete room

}
