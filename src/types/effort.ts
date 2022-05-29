interface Factors {
  [unit: string]: {
    code: number, 
    smallest: string | undefined,
    factors: {
      [unit: string]: number
    }, 
    beginning: string, 
    singular: string, 
    plural: string, 
  }
}

export default class Effort {
  unit: number = 'c'.charCodeAt(0)
  amount: number = 0

  static fulls = ['century', 'year', 'month', 'week', 'day', 'hour', 'minute', 'second']
  static plural = ['centuries', 'years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds']
  static unitInfo: Factors = {
    c: {
      code: 'c'.charCodeAt(0), 
      factors: {
        y: 100, 
      },
      smallest: 'y', 
      beginning: 'c', 
      singular: 'century', 
      plural: 'centuries'
    }, 
    y: {
      code: 'y'.charCodeAt(0), 
      factors: {
        o: 12, 
        w: 52, 
        d: 365, 
      },
      smallest: 'd', 
      beginning: 'y', 
      singular: 'year', 
      plural: 'years'
    }, 
    o: {
      code: 'o'.charCodeAt(0), 
      factors: {
        w: 4, 
        d: 30, 
      }, 
      smallest: 'd', 
      beginning: 'mo', 
      singular: 'month', 
      plural: 'months'
    }, 
    w: {
      code: 'w'.charCodeAt(0), 
      factors: {
        d: 7, 
      }, 
      smallest: 'd', 
      beginning: 'w', 
      singular: 'week', 
      plural: 'weeks'
    }, 
    d: {
      code: 'd'.charCodeAt(0), 
      factors: {
        h: 24
      }, 
      smallest: 'h', 
      beginning: 'd', 
      singular: 'day', 
      plural: 'days'
    }, 
    h: {
      code: 'h'.charCodeAt(0), 
      factors: {
        i: 60, 
      }, 
      smallest: 'i', 
      beginning: 'h', 
      singular: 'hour', 
      plural: 'hours'
    }, 
    i: {
      code: 'i'.charCodeAt(0), 
      factors: {
        s: 60, 
      }, 
      smallest: 's', 
      beginning: 'mi', 
      singular: 'minute', 
      plural: 'miuntes'
    }, 
    s: {
      code: 's'.charCodeAt(0), 
      factors: {
      }, 
      smallest: undefined, 
      beginning: 's', 
      singular: 'second', 
      plural: 'seconds' 
    }
  }  

  static fromString(s: string) : Effort {
    let smallestUnit = 'c'
    let efforts: Effort[] = []
    Object.keys(Effort.unitInfo).forEach(unitChar => {
      let unit = Effort.unitInfo[unitChar]
      let match = s.match(new RegExp('(\\d+\\.?\\d*)\\s*' + unit.beginning))
      if(match !== null) {
        console.log("match", match[1]) 
        let amount = parseFloat(match[1])
        efforts.push(new Effort(
          unitChar, 
          amount
        ))
        smallestUnit = unitChar
      }
    })
    console.log("smallest unit", smallestUnit) 
    let totalAmount = 0
    for(let effort of efforts) {
      effort.convert(smallestUnit) 
      totalAmount += effort.amount
    }
    return new Effort(
      smallestUnit, 
      totalAmount
    )
  }

  constructor(unitChar: string, amount: number) {
    this.unit = unitChar.charCodeAt(0)
    this.amount = amount
  }

  static getConversionFactor(biggerUnit: string, smallerUnit: string) : null | number {
    let unitInfo = Effort.unitInfo[biggerUnit]
    let factor = unitInfo.factors[smallerUnit]
    if(factor) {
      return factor
    } else {
      let smallest = unitInfo.smallest
      if (smallest) {
        let factor1 = unitInfo.factors[smallest]
        let factor2 = Effort.getConversionFactor(smallest, smallerUnit)
        if(factor2) {
          return factor1 * factor2
        } else {
          return null
        }
      } else {
        return null
      }
    }  
  }

  convert(targetUnit: string) {
    let unit = String.fromCharCode(this.unit)
    let factor = Effort.getConversionFactor(unit, targetUnit)
    if(factor) {
      this.amount *= factor
      this.unit = targetUnit.charCodeAt(0)
    }
  }

  humanize() : string {
    let unit = Effort.unitInfo[String.fromCharCode(this.unit)]
    return this.amount.toString() + " " + (
      this.amount == 1 ? unit.singular : unit.plural
    )
  }

  eq(other: Effort) : boolean {
    return this.amount == other.amount && this.unit == other.unit
  }
}
