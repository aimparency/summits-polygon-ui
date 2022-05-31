import Vec2 from 'gl-vec2'

type V2 = number[]

const SQR_3_4 = Math.sqrt(3/4); 

function rotCCW(v: V2) {
  return Vec2.fromValues(v[1], -v[0])
}

function rotCW(v: V2) {
  return Vec2.fromValues(v[1], -v[0])
}

function makeCircularPath(
  from: {pos: V2, r: number}, 
  fromShare: number, 
  into: {pos: V2, r: number}
) : string {
  const delta = Vec2.clone(into.pos)
  Vec2.sub(delta, delta, from.pos)
  const R = Vec2.len(delta)

  if(R < from.r) {
    return ""
  } else {
    const deltaRot = rotCCW(delta)
    Vec2.scale(deltaRot, deltaRot, SQR_3_4) 

    // point beween from and into
    const halfWay = Vec2.clone(from.pos)
    Vec2.add(halfWay, halfWay, into.pos) 
    Vec2.scale(halfWay, halfWay, 0.5)

    // center point of arc
    const M = Vec2.clone(halfWay)
    Vec2.add(M, M, deltaRot)

    const getMNorm = (point: V2) : V2 => {
      let result = Vec2.clone(point)
      Vec2.sub(result, result, M) 
      return Vec2.normalize(result, result) 
    }

    const getArcPoint = (radius: number) : V2 => {
      const a = Math.pow(radius, 2) / (2 * R)
      const h = Math.sqrt(Math.pow(radius, 2) - Math.pow(a, 2))

      const normMToInto = getMNorm(into.pos)
      Vec2.scale(normMToInto, normMToInto, a) 

      const normMToIntoRot = rotCW(normMToInto)
      Vec2.scale(normMToIntoRot, normMToIntoRot, h)

      const result = Vec2.clone(into.pos)
      Vec2.sub(result, result, normMToInto) 
      return Vec2.sub(result, result, normMToIntoRot) 
    }

    const width = 2 /* nice */ * from.r * fromShare;

    const arrowPeak = getArcPoint(into.r); 

    const arrowWings = getArcPoint(into.r + width * 2)
    const normMToArrowWings = getMNorm(arrowWings)


    const toFarWingSide = Vec2.clone(normMToArrowWings)
    Vec2.scale(toFarWingSide, toFarWingSide, width); 
    const toNearWingSide = Vec2.clone(normMToArrowWings)
    Vec2.scale(toNearWingSide, toNearWingSide, width * 0.5); 

    const wingOuterFar = Vec2.clone(arrowWings)
    Vec2.add(wingOuterFar, wingOuterFar, toFarWingSide);
    const wingOuterNear = Vec2.clone(arrowWings)
    Vec2.add(wingOuterNear, wingOuterNear, toNearWingSide);
    const wingInnerFar = Vec2.clone(arrowWings)
    Vec2.sub(wingInnerFar, wingInnerFar, toFarWingSide);
    const wingInnerNear = Vec2.clone(arrowWings)
    Vec2.sub(wingInnerNear, wingInnerNear, toNearWingSide); 

    const normMToMFrom = getMNorm(from.pos); 
    const toTheSide = Vec2.clone(normMToMFrom)
    Vec2.scale(toTheSide, toTheSide, width * 0.5); 
    const startOuter = Vec2.clone(from.pos)
    Vec2.add(startOuter, startOuter, toTheSide); 
    const startInner = Vec2.clone(from.pos)
    Vec2.sub(startInner, startInner, toTheSide); 


    const outerDistance = Vec2.dist(wingOuterNear, startOuter); 
    const outerMToArrowWingsRot = rotCW(normMToArrowWings)
    Vec2.scale(outerMToArrowWingsRot, outerMToArrowWingsRot, outerDistance * 0.34) 

    const outerWingControl = Vec2.clone(wingOuterNear)
    Vec2.sub(outerWingControl, outerWingControl, outerMToArrowWingsRot)
    const outerStartControl = Vec2.clone(startOuter)
    Vec2.sub(outerStartControl, outerStartControl, outerMToArrowWingsRot)

    const innerDistance = Vec2.dist(wingInnerNear, startInner)
    const innerMToArrowWingsRot = rotCW(normMToArrowWings)
    Vec2.scale(innerMToArrowWingsRot, innerMToArrowWingsRot, innerDistance * 0.34) 

    const innerWingControl = Vec2.clone(wingInnerNear)
    Vec2.sub(innerWingControl, innerWingControl, innerMToArrowWingsRot)
    const innerStartControl = Vec2.clone(startInner)
    Vec2.sub(innerStartControl, innerStartControl, innerMToArrowWingsRot) 

    return [
      'M', startInner, 
      'C', innerStartControl, innerWingControl, wingInnerNear,  
      'L', wingInnerFar, 
      'L', arrowPeak, 
      'L', wingOuterFar, 
      'L', wingOuterNear, 
      'C', outerWingControl, outerStartControl, startOuter, 
      'Z'
    ].map(c => {
      if(c instanceof String) {
        return c
      } else {
        return `${c[0]} ${c[1]}`;
      }
    }).join(' ') 
  }
}

export default makeCircularPath
