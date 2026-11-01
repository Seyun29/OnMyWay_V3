// async searchOnPath(params: SearchOnPathQuery) {
//     let searchResults = []; // list to return
//     //default Radius값 필요
//     const { query, category, startX, startY, endX, endY } = params;
//     const radius = parseInt(params.radius); //TODO: add pipe to validate, convert to number (not to use parseInt)
//     //radius has to be given as int, in 'meter' unit
//     const data = await this.getDrivingRoute({ startX, startY, endX, endY });
//     //routes[0].result_code로 분기 가능
//     if (data.routes[0].result_code !== 0) {
//       //분기 로직 실행
//       // throw new HttpException(data.routes[0].result_message, 400);
//     } else {
//       //길찾기 성공시
//       const roads = data.routes[0].sections[0].roads;
//       const tmpVertexList = [];
//       roads.map((road) => {
//         tmpVertexList.push(...road.vertexes);
//       });
//       const vertexList = tmpVertexList.reduce((acc, cur, idx) => {
//         if (idx % 2 === 0) acc.push([cur]);
//         else acc[acc.length - 1].push(cur);
//         return acc;
//       }, []);
//       const totalDistance = parseInt(data.routes[0].summary.distance);

//       //decide which vertices to use for keyword search
//       const selectedVertices: string[][] = selectVertices({
//         vertexList,
//         totalDistance,
//         radius,
//       });

//       //getKeywordSearch() for each selectedVertex
//       //res.data.documents 싹다 모으기 (res.data.documents => place_name, place_url, x, y 값만)
//       //search keyword on selected vertices
//       //FIXME: 실패하더라도 다른 결과값은 반환해야 함 -> ./api폴더로 api들 옮기고, 서비스 로직이랑은 분리해서 사용하기. HttpRequestError반환 x
//       //단 여러번의 검색 수행 중 에러난게 있었다면, 일부 에러가 있었다는 정보를 반환해야 함

//       아래 코드 레거시로 남겨두기, 본 코드 내 함수 모듈화, 분리해서 사용하기, api로직 분기하기.
//       Below code takes 3.62 seconds (Seoul-Gangneung, 꽃), 5.8 seconds (Seoul-Busan, 꽃)
//       for (const vertex of selectedVertices) {
//         //vertex = [x, y]
//         try {
//           const data = await this.getKeywordSearch({
//             query: query,
//             x: vertex[0],
//             y: vertex[1],
//             radius: radius.toString(),
//           });
//           data.documents.map((document) => {
//             searchResults.push({
//               place_name: document.place_name,
//               place_url: document.place_url,
//               x: document.x,
//               y: document.y,
//             });
//           });
//         } catch (err) {
//           console.log(err); //TODO: delete console.log
//           //throw Error
//         }
//       }

//     //   // Below code takes 2.31 seconds (Seoul-Gangneung, 꽃), 3.5 seconds (Seoul-Busan, 꽃)
//     //   const promises = selectedVertices.map((vertex) =>
//     //     this.getKeywordSearch({
//     //       query: query,
//     //       x: vertex[0],
//     //       y: vertex[1],
//     //       radius: radius.toString(),
//     //     }),
//     //   );

//     //   const results = await Promise.allSettled(promises);

//     //   const successfulResults = results.filter(
//     //     (result) => result.status === 'fulfilled',
//     //   );

//     //   if (successfulResults.length < promises.length - 2) {
//     //     //TODO: add error handling Logic
//     //     throw new Error('More than 2 requests failed');
//     //   }

//     //   successfulResults.forEach((result: PromiseFulfilledResult<any>) => {
//     //     result.value.documents.map((document) => {
//     //       searchResults.push({
//     //         place_name: document.place_name,
//     //         place_url: document.place_url,
//     //         x: document.x,
//     //         y: document.y,
//     //       });
//     //     });
//     //   });

//       //remove duplicates
//       searchResults = removeDuplicate([...searchResults]);
//     }

//     return searchResults;
//   }
