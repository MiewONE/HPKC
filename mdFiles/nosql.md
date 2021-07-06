# NoSQL 데이터베이스

## NoSQL?
> Not Only SQL.

스키마 없이 데이터를 표현하는 것이 주된 특징인 일련의 데이터베이스들을 의미.

## 일반적인 특징
- 정해진 스키마가 없음
- 데이터베이스의 종류에 따라 그 특성이 매우 다르다. ( RDBMS가 비슷비슷한것과 다름)

## 장점 
- 높은 수평 확장성
- 초기 개발의 용이성
- 스키마 성계의 유연성

## 단점
- 표준의 부재
- SQL에 비해 약한 qeury capability
- data consistency를 어플리케이션 레벨에서 보장해야 함. (높은 유연성으로 볼 수도 있음)
## 수직 확장 vs. 수평 확장
### 수직 확장(vertical scaling)

- 한 인스턴스의 가용자원(CPU,memory,storage)을 키워 더 큰 로드를 감당한다.
- 어디까지나 한 인스턴스를 키우는 것이기 때문에 확장이 제한적이다.

### 수형 확장(horizontal scaling)

- 더 많은 인스턴스를 만들어 더 큰 로드를 감당
- 수편 확장이 가능한 구조이고, 운영 비용만 감당할 수 있다면 이론적으로 얼마나 많은 로드라도 받아낼수 있다.

## 종류
- key-Value
    - Redis,AWS DynamoDB
    - 모든 레코드는 key-value의 페어이다.
    - value는 어떤 값이든 될 수 있다.
    - NoSQL 데이터베이스의 가장 단순한 형태이다.
- Document-based
    - DynamoDB,CouchDB
    - 각 레코드가 하나의 문서가 된다.
    - 문서는 데이터베이스에 따라 XML,YAML,JSON,BSON 등을 사용한다.
    - 문서의 내부적 구조를 통한 쿼리 최적화, 활용성 높은 API 등이 제공된다.
- Graph-based
    - Neo4j,AWS Neptune
    - 그래프 이론을 바탕으로, 데이터베이스를 그래프로 표현한다.
    - 그래프는 node와 edge 그리고 property로 이루어진다.
    - 관계가 first-class citizen이기 때문에 관계 기반 문제(실시간 추천 등)에 유리하다.
                                      
# Embedded, Reference

## Embedded 데이터베이스 시스템
> [Embedded DB](https://ko.wikipedia.org/wiki/%EC%9E%84%EB%B2%A0%EB%94%94%EB%93%9C_%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4)

Embedded 데이터베이스 시스템은 데이터베이스 시스템이 애플리케이션의 최종 사용자로 부터 숨겨지며 유지보수가 거의 소요되지 않게 하기 위해 데이터 저장
접근 권하을 요구하는 응용 소프트웨어와 밀접하게 연동되는 데이터베이스 관리 시스템이다.

### 실질적인 기술 분류
- SQL 및 사유 네이티브 API를 포함한 API를 갖춘 데이터베이스 시스템
- 데이터베이스 아키텍처(클라이언트)
- 스토리지 모드(온 디스크,인 메모리, 또는 이 둘 조합)
- 데이터베이스 모델(관계,객체 지향,엔티티-속성-값 모델,네트워크/CODASYL)
- 대상 시장

## Reference 데이터베이스 시스템 

# Document 관계 데이터 저장 유형
> [Ref : MongoDB 데이터 관계 모델링](https://devhaks.github.io/2019/11/30/mongodb-model-relationships/)
## Embedded
저장 방법
- 2가지 종류의 Document가 있을 때,1개의 Document 데이터를 다른 Document key의 value에 저장하는 방법

```json
[
  {
      //Person
     "_id": "joe",
     "name": "Joe Bookreader"
  },
  {
      //Address
     "pataron_id": "joe",
     "street": "123 Fake Street",
     "city": "Faketon",
     "state": "MA",
     "zip": "12345"
  }
]
```

Document를 Embedded 방식으로 관계를 저장하면 밑에 방식과 같다.
Persion.address에 Address Document가 통째로 저장되어 있는 것을 확인할 수 있음.

```json
[
  {
      //Person
      "_id": "joe",
      "name": "Joe Bookreader",
      "address": {
        "street": "123 Fake Street",
        "city": "Faketon",
        "state": "MA",
        "zip": "12345"
      }
  },
  {
      //Address
      "pataron_id": "joe",
      "street": "123 Fake Street",
      "city": "Faketon",
      "state": "MA",
      "zip": "12345"
  }
]
```

## Reference

Reference 저장 방법은 pointer 개념으로 생각하자. Embedded 방식과 달리 Document를 통째로 저장하는것이 아니라 참조 할 수 있도록 ID를 저장하는것

```json
  
[
  // Publisher
  {
    "_id": "oreilly",
    "name": "O'Reilly Media",
    "founded": 1980,
    "location": "CA"
  },
  // Book
  {
    "_id": 123456789,
    "title": "MongoDB: The Definitive Guide",
    "author": [ "Kristina Chodorow", "Mike Dirolf" ],
    "published_date": ISODate("2010-09-24"),
    "pages": 216,
    "language": "English",
    "publisher_id": "oreilly" // <- Publisher._id
  }
]
```

## document 관계 유형

### One-to-One

단순한 1:1 관계.<br>
Person이 실제 주민 등록등본상에 거주지가 Address인 것으로 시나리오를 가정하는 관계 유형.

### One-to-Many
#### __Embedded__ 방식
데이터구조는 Book.publisher의 value에는 Publisher 데이터가 통째로 저장되어있다.

|Book|Publisher|
|:---:|:---:|
|Many|One|
```json
[// Publisher
  {
     "_id": "oreilly",
     "name": "O'Reilly Media",
     "founded": 1980,
     "location": "CA"
  },
  // Book 1
  {
     "_id": 123456789,
     "title": "MongoDB: The Definitive Guide",
     "author": [ "Kristina Chodorow", "Mike Dirolf" ],
     "published_date": ISODate("2010-09-24"),
     "pages": 216,
     "language": "English",
  
     "publisher": {
        "name": "O'Reilly Media",
        "founded": 1980,
        "location": "CA"
     }
  },
  // Book 2
  {
     "_id": 234567890,
     "title": "50 Tips and Tricks for MongoDB Developer",
     "author": "Kristina Chodorow",
     "published_date": ISODate("2011-05-06"),
     "pages": 68,
     "language": "English",
  
     "publisher": {
        "name": "O'Reilly Media",
        "founded": 1980,
        "location": "CA"
     }
  }
]
```

#### __Reference__ 방식
2개의 Book.publisher_id 의 value는 Publisher._id value가 저장되어 있다.

```json
// Publisher
[
  {
     "_id": "oreilly",
     "name": "O'Reilly Media",
     "founded": 1980,
     "location": "CA"
  },
  
  // Book 1
  {
     "_id": 123456789,
     "title": "MongoDB: The Definitive Guide",
     "author": [ "Kristina Chodorow", "Mike Dirolf" ],
     "published_date": ISODate("2010-09-24"),
     "pages": 216,
     "language": "English",
  
     "publisher_id": "oreilly" // <- Publisher._id
  },
  
  // Book 2
  {
     "_id": 234567890,
     "title": "50 Tips and Tricks for MongoDB Developer",
     "author": "Kristina Chodorow",
     "published_date": ISODate("2011-05-06"),
     "pages": 68,
     "language": "English",
  
     "publisher_id": "oreilly" // <- Publisher._id
  }
]
```
#### 생각해야하는 점

연결된 publisher의 name이 변경하거나 age라는 데이터를 추가 해야하는 경우 db를 수정해야하는데
임베디드 방식이라면 Publisher,Book의 Document를 모두 수정해야서 데이터의 일관성을 유지해야한다.

데이터를 자주 변경해야하는 상황이 생긴다면 _일관성_ 을 유지하기가 어려워진다.

Publisher Doc. 개수 : 100개
Book Doc. 개수: 100만개

극단적으로 100만개의 Book Doc.를 Publisher정보를 포함하여 불러오려고할때 임베디드는 
저장된 데이터를 그냥 가져오면 되지만

참조 방식으로는 저장된 데이터의 Publisehr_id 에 해당되는 Publisher 정보를 포함하도록 요청해서 가져와야 하기때문에
한번의 요청만으로는 Publisher 정보를 가져올 수는 없을 것이다. 추가적은 요청 필요.



### Many-to-Many
One-to-Many 관계에서 확장된 관계 유형. Document 관계가 m:n이다.

Publisher와 book의 관계를 예시로 들면, One-to-Many에서 Book의Publisher가 1개 이상이 될 수 있는 구조로 된다.

One-to-Many에서 Publisher:Book=1:N 이었지만 Many-to-Many는 m:n이 가능한 구조이다.
아래 예시에는 Book.publisher_id value가 1개 이상의 Publisher.id를 참조하고 있다.

```json
[
  // Publisher 1
  {
     "_id": "oreilly",
     "name": "O'Reilly Media",
     "founded": 1980,
     "location": "CA"
  },

  // Publisher 2
  {
     "_id": "devhak",
     "name": "devhak'Reilly Media",
     "founded": 1980,
     "location": "CA"
  },


  // Book 1
  {
     "_id": 123456789,
     "title": "MongoDB: The Definitive Guide",
     "author": [ "Kristina Chodorow", "Mike Dirolf" ],
     "published_date": ISODate("2010-09-24"),
     "pages": 216,
     "language": "English",
  
     "publisher_id": ["oreilly", "devhak"] // <- Publisher._id
  },
  
  // Book 2
  {
     "_id": 234567890,
     "title": "50 Tips and Tricks for MongoDB Developer",
     "author": "Kristina Chodorow",
     "published_date": ISODate("2011-05-06"),
     "pages": 68,
     "language": "English",
  
     "publisher_id": ["oreilly", "devhak"] // <- Publisher._id
  }
]
```

# MongoDb

## aggregate
Aggregation Framework는 데이터 처리 파이프라인의 개념을 모델로함
문서는 여러 단계의 파이프라인을 거쳐 변화하고 하나의 문서의형태로 집계할 수 있다.

## $Lookup
|field|Destination|
|---|---|
|from|동일한 데이터베이스 내에서 조인이 수행될 콜렉션을 특정. from은 새딩되지 않는다.|
|localField|Document로부터 $lookup 스테이지에 입력할 필드를 선택 $lookup은 localField를 foreignField에게 equality match를 수행|
|foreignField|from 콜렉션에 있는 Document로부터 필드를 특정|
|as|입력 Document에 더해질 새로운 배열 필드의 이름을 특정.|