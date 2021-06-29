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