import * as vec2 from './vec2'

const SQR_3_4 = Math.sqrt(3/4); 

function rotCCW(v: vec2.T) {
  return vec2.fromValues(-v[1], v[0])
}

function rotCW(v: vec2.T) {
  return vec2.fromValues(v[1], -v[0])
}

function makeCircularPath(
  from: {pos: vec2.T, r: number}, 
  fromShare: number, 
  into: {pos: vec2.T, r: number}
) : string {
  const delta = vec2.crSub(into.pos, from.pos)
  const R = vec2.len(delta)

  if(R < from.r) {
    return ""
  } else {
    const deltaRot = rotCW(delta)
    vec2.scale(deltaRot, deltaRot, SQR_3_4) 

    // point beween from and into
    const halfWay = vec2.clone(from.pos)
    vec2.add(halfWay, halfWay, into.pos) 
    vec2.scale(halfWay, halfWay, 0.5)

    // center point of arc
    const M = vec2.clone(halfWay)
    vec2.add(M, M, deltaRot)

    const getMNorm = (point: vec2.T) : vec2.T => {
      let result = vec2.clone(point)
      vec2.sub(result, result, M) 
      vec2.normalize(result, result) 
      return result
    }

    const getArcPoint = (radius: number) : vec2.T => {
      const a = Math.pow(radius, 2) / (2 * R)
      const h = Math.sqrt(Math.pow(radius, 2) - Math.pow(a, 2))

      const normMToInto = getMNorm(into.pos)
      vec2.scale(normMToInto, normMToInto, a) 

      const normMToIntoRot = rotCW(normMToInto)
      vec2.scale(normMToIntoRot, normMToIntoRot, h)

      const result = vec2.clone(into.pos)
      vec2.sub(result, result, normMToInto) 
      vec2.sub(result, result, normMToIntoRot) 
      return result
    }

    const width = 2 /* nice */ * from.r * fromShare;

    const arrowPeak = getArcPoint(into.r); 

    const arrowWings = getArcPoint(into.r + width * 2)
    const normMToArrowWings = getMNorm(arrowWings)


    const toFarWingSide = vec2.clone(normMToArrowWings)
    vec2.scale(toFarWingSide, toFarWingSide, width); 
    const toNearWingSide = vec2.clone(normMToArrowWings)
    vec2.scale(toNearWingSide, toNearWingSide, width * 0.5); 

    const wingOuterFar = vec2.clone(arrowWings)
    vec2.add(wingOuterFar, wingOuterFar, toFarWingSide);
    const wingOuterNear = vec2.clone(arrowWings)
    vec2.add(wingOuterNear, wingOuterNear, toNearWingSide);
    const wingInnerFar = vec2.clone(arrowWings)
    vec2.sub(wingInnerFar, wingInnerFar, toFarWingSide);
    const wingInnerNear = vec2.clone(arrowWings)
    vec2.sub(wingInnerNear, wingInnerNear, toNearWingSide); 

    const normMToMFrom = getMNorm(from.pos); 
    const toTheSide = vec2.clone(normMToMFrom)
    vec2.scale(toTheSide, toTheSide, width * 0.5); 
    const startOuter = vec2.clone(from.pos)
    vec2.add(startOuter, startOuter, toTheSide); 
    const startInner = vec2.clone(from.pos)
    vec2.sub(startInner, startInner, toTheSide); 

    const outerDistance = vec2.dist(wingOuterNear, startOuter); 
    const outerMToArrowWingsRot = rotCW(normMToArrowWings)
    vec2.scale(outerMToArrowWingsRot, outerMToArrowWingsRot, outerDistance * 0.34) 

    const outerWingControl = vec2.clone(wingOuterNear)
    vec2.sub(outerWingControl, outerWingControl, outerMToArrowWingsRot)
    const outerStartControl = vec2.clone(startOuter)
    vec2.sub(outerStartControl, outerStartControl, outerMToArrowWingsRot)

    const innerDistance = vec2.dist(wingInnerNear, startInner)
    const innerMToArrowWingsRot = rotCW(normMToArrowWings)
    vec2.scale(innerMToArrowWingsRot, innerMToArrowWingsRot, innerDistance * 0.34) 

    const innerWingControl = vec2.clone(wingInnerNear)
    vec2.sub(innerWingControl, innerWingControl, innerMToArrowWingsRot)
    const innerStartControl = vec2.clone(startInner)
    vec2.sub(innerStartControl, innerStartControl, innerMToArrowWingsRot) 

    const pathSpec = [
      'M', startInner, 
      'C', innerStartControl, innerWingControl, wingInnerNear,  
      'L', wingInnerFar, 
      'L', arrowPeak, 
      'L', wingOuterFar, 
      'L', wingOuterNear, 
      'C', outerWingControl, outerStartControl, startOuter, 
      'Z'
    ]


    return pathSpec.map(c => {
      if((typeof c) == "string") {
        return c
      } else {
        return `${c[0]} ${c[1]}`
      } 
    }).join(' ') 
  }
}

export default makeCircularPath
