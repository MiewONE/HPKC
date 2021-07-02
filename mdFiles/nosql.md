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