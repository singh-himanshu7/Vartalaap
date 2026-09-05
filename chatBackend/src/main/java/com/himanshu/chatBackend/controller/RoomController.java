package com.himanshu.chatBackend.controller;

import com.himanshu.chatBackend.entities.Message;
import com.himanshu.chatBackend.entities.Room;
import com.himanshu.chatBackend.repositories.RoomRepository;
import com.himanshu.chatBackend.services.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/room")
@CrossOrigin("*")
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
    @GetMapping("/{roomID}")
    ResponseEntity<?> joinRoom(@PathVariable String roomID){
        try {
            Room room = roomService.joinRoom(roomID);
            return ResponseEntity.ok().body(room);
        }
        catch (RuntimeException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    //get message of the room
//    @GetMapping("/{roomID}/messages")
//    public ResponseEntity <List<Message>> getMessages(@PathVariable String roomID,
//                                                      @RequestParam (value = "page",defaultValue = "0" , required = false)int page,
//                                                      @RequestParam (value = "size",defaultValue = "20",required = false)int size){
//        try {
//            Room room = roomService.getMessages(roomID);
//            List<Message> messageList = room.getMessages();
//            return ResponseEntity.ok(messageList);
//        }
//        catch (RuntimeException e){
//            return ResponseEntity.badRequest().build();
//        }
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable String roomId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        List<Message> paginatedMessages =
                roomService.getMessages(roomId, page, size);

        return ResponseEntity.ok(paginatedMessages);
    }
    //delete room

}
