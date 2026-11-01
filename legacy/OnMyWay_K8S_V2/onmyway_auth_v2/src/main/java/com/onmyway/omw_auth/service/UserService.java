package com.onmyway.omw_auth.service;

import com.onmyway.omw_auth.domain.Favorites;
import com.onmyway.omw_auth.domain.History;
import com.onmyway.omw_auth.domain.User;
import com.onmyway.omw_auth.dto.request.AddFavoritesRequest;
import com.onmyway.omw_auth.dto.request.AddHistoryRequest;
import com.onmyway.omw_auth.dto.request.RegisterRequest;
import com.onmyway.omw_auth.enums.Role;
import com.onmyway.omw_auth.repository.FavoritesRepository;
import com.onmyway.omw_auth.repository.HistoryRepository;
import com.onmyway.omw_auth.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final FavoritesRepository favoritesRepository;
    private final HistoryRepository historyRepository;

    public UserService(UserRepository userRepository, BCryptPasswordEncoder bCryptPasswordEncoder, FavoritesRepository favoritesRepository, HistoryRepository historyRepository) {
        this.userRepository = userRepository;
        this.bCryptPasswordEncoder = bCryptPasswordEncoder;
        this.favoritesRepository = favoritesRepository;
        this.historyRepository = historyRepository;
    }

    @Transactional
    public void register(RegisterRequest registerRequest) throws RuntimeException {
        String username = registerRequest.getUsername();
        String password = registerRequest.getPassword();

        boolean isExist = userRepository.existsByUsername(username);

        if (isExist) {
            //FIXME: fixme "Username already exists"
            throw new RuntimeException("Username already exists");
        }

        User data = new User();

        data.setUsername(username);
        data.setPassword(bCryptPasswordEncoder.encode(password));
        data.setRole(String.valueOf(Role.ROLE_USER)); //FIXME: apply ENUM type, fix roles
        //add time stamp here
        data.setCreatedAt(LocalDateTime.now());
        //        data.setDeleted(false); -> set as default in User.java

        userRepository.save(data);
    }

    public void logout() {
        //logout service TBU

    }

    @Transactional
    public void addFavorites(AddFavoritesRequest request) {
        //FIXME: !!! add validation logic (e.g. Coordinate is null .. etc.)
        Favorites data = new Favorites();
        data.setPlaceName(request.getPlaceName());
        data.setAddressName(request.getAddressName());
        data.setRoadAddressName(request.getRoadAddressName());
        data.setLongitude(request.getCoordinate()
                .getLongitude());
        data.setLatitude(request.getCoordinate()
                .getLatitude());
        User user = userRepository.findByUsername(request.getUsername());
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        data.setUser(user);

        favoritesRepository.save(data);
    }

    public List<Favorites> getFavorites(String username) {
        return favoritesRepository.findFavoritesByUsername(username);
    }

    @Transactional
    public void addHistory(AddHistoryRequest request) {
        History data = new History();
        data.setPlaceName(request.getPlaceName());
        data.setAddressName(request.getAddressName());
        data.setRoadAddressName(request.getRoadAddressName());
        data.setLongitude(request.getCoordinate()
                .getLongitude());
        data.setLatitude(request.getCoordinate()
                .getLatitude());

        User user = userRepository.findByUsername(request.getUsername());

        if (user == null) {
            throw new RuntimeException("User not found");
        }
        
        data.setUser(user);

        historyRepository.save(data);
    }

    public List<History> getHistory(String username) {
        return historyRepository.findHistoryByUsername(username);
    }
}